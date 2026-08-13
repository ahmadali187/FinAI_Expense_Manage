import unittest
import re
import datetime

def normalize_receipt_text(text):
    if not text:
        return ""
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'[₹\$]|Rs\.?|RS\.?|INR', ' ₹ ', text, flags=re.IGNORECASE)
    text = re.sub(r'\t', ' ', text)
    return re.sub(r' +', ' ', text)

def predict_category(merchant_or_text):
    text = (merchant_or_text or '').lower()
    if any(k in text for k in ['starbucks', 'cafe', 'coffee', 'restaurant', 'pizza', 'burger', 'food', 'dining']):
        return 'Food & Dining'
    if any(k in text for k in ['amazon', 'flipkart', 'store', 'mart', 'retail', 'shopping']):
        return 'Shopping'
    if any(k in text for k in ['uber', 'ola', 'cab', 'fuel', 'petrol', 'transport']):
        return 'Transport'
    if any(k in text for k in ['power', 'electric', 'water', 'gas', 'bill', 'utility']):
        return 'Utilities'
    return 'Other'

def parse_receipt_text_python(raw_text, existing_transactions=None):
    normalized = normalize_receipt_text(raw_text)
    lines = [l.strip() for l in normalized.split('\n') if l.strip()]

    if not lines:
        return {
            'merchant': 'Unreadable Merchant',
            'amount': '',
            'date': datetime.date.today().isoformat(),
            'category': 'Other',
            'confidence': {'overall': 'Low', 'merchant': 'Low', 'amount': 'Low', 'date': 'Low'},
            'is_duplicate': False
        }

    # Merchant
    merchant = None
    merchant_confidence = 'Low'
    non_merchant_exact = re.compile(r'^(gstin|invoice|receipt|tax|phone|tel|address|date|total|cashier|welcome|thank\s*you|bill\s*no|receipt\s*#|receipt\s*no)$', re.IGNORECASE)
    line_has_non_merchant = re.compile(r'(gstin|tax\s*id|invoice\s*#|tel:|phone:)', re.IGNORECASE)

    for i in range(min(5, len(lines))):
        clean = re.sub(r'[^a-zA-Z0-9\s&\'\-]', '', lines[i]).strip()
        if len(clean) >= 3 and not non_merchant_exact.match(clean) and not line_has_non_merchant.search(lines[i]):
            merchant = clean
            merchant_confidence = 'High' if i <= 1 else 'Medium'
            break

    if not merchant:
        merchant = 'Merchant could not be confidently identified'
        merchant_confidence = 'Low'

    # Amount Priority 1: Payable Final Totals
    amount = None
    amount_confidence = 'Low'
    p1_regex = re.compile(r'(?:grand\s*total|net\s*total|amount\s*payable|amount\s*due|balance\s*due|total\s*due|total\s*paid|paid\s*amount|total\s*amount)[\s:₹]*([0-9]+(?:[.,][0-9]{2})?)', re.IGNORECASE)

    for line in lines:
        match = p1_regex.search(line)
        if match and match.group(1):
            val = float(match.group(1).replace(',', '.'))
            if val > 0:
                amount = f"{val:.2f}"
                amount_confidence = 'High'
                break

    # Amount Priority 2: Generic Total / Subtotal
    if not amount:
        p2_regex = re.compile(r'(?:total|subtotal|amount)[\s:₹]*([0-9]+(?:[.,][0-9]{2})?)', re.IGNORECASE)
        for line in lines:
            match = p2_regex.search(line)
            if match and match.group(1):
                val = float(match.group(1).replace(',', '.'))
                if val > 0:
                    amount = f"{val:.2f}"
                    amount_confidence = 'Medium'
                    break

    if not amount:
        monetary = []
        gen_regex = re.compile(r'(?:₹|\b)\s*([0-9]+[.,][0-9]{2})\b')
        for match in gen_regex.finditer(normalized):
            val = float(match.group(1).replace(',', '.'))
            if val > 0:
                monetary.append(val)
        if monetary:
            amount = f"{monetary[-1]:.2f}"
            amount_confidence = 'Medium'

    # Date
    date_str = datetime.date.today().isoformat()
    date_confidence = 'Low'
    date_pats = [
        re.compile(r'(\d{4}[-/]\d{2}[-/]\d{2})'),
        re.compile(r'(\d{2}[-/]\d{2}[-/]\d{4})'),
        re.compile(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})', re.IGNORECASE)
    ]

    for line in lines:
        for pat in date_pats:
            d_match = pat.search(line)
            if d_match:
                date_str = d_match.group(1)
                date_confidence = 'High'
                break
        if date_confidence == 'High':
            break

    category = predict_category(merchant + ' ' + normalized)

    if not amount:
        overall_conf = 'Low'
    elif amount_confidence == 'High' and merchant_confidence == 'High':
        overall_conf = 'High'
    elif amount_confidence != 'Low' or merchant_confidence != 'Low':
        overall_conf = 'Medium'
    else:
        overall_conf = 'Low'

    is_duplicate = False
    if amount and existing_transactions:
        num_amt = float(amount)
        for t in existing_transactions:
            if abs(float(t.get('amount', 0)) - num_amt) < 0.01:
                is_duplicate = True
                break

    return {
        'merchant': merchant,
        'amount': amount or '',
        'date': date_str,
        'category': category,
        'confidence': {
            'overall': overall_conf,
            'merchant': merchant_confidence,
            'amount': amount_confidence,
            'date': date_confidence
        },
        'is_duplicate': is_duplicate
    }

class OCRParsingTestSuite(unittest.TestCase):

    def test_case_1_clear_restaurant_receipt(self):
        text = "Starbucks Coffee\n123 Main St\nDate: 2026-08-10\nLatte ₹250.00\nSubtotal: 250.00\nGrand Total: ₹250.00\nThank You"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['merchant'], 'Starbucks Coffee')
        self.assertEqual(res['amount'], '250.00')
        self.assertEqual(res['category'], 'Food & Dining')
        self.assertEqual(res['confidence']['overall'], 'High')

    def test_case_2_blurry_receipt(self):
        text = "Strbcks Cff\nDt: 2026-08-10\nTotl: 180.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '180.00')
        self.assertIn(res['confidence']['overall'], ['High', 'Medium'])

    def test_case_3_dark_receipt(self):
        text = "Cafe Coffee Day\nTotal Paid: 340.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '340.00')
        self.assertEqual(res['category'], 'Food & Dining')

    def test_case_4_rotated_receipt(self):
        text = "Uber Trip Receipt\nDate: 2026-08-09\nFare Amount Payable: ₹450.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['merchant'], 'Uber Trip Receipt')
        self.assertEqual(res['amount'], '450.00')
        self.assertEqual(res['category'], 'Transport')

    def test_case_5_long_receipt(self):
        text = "Flipkart Supermart\nGSTIN: 29ABCDE1234F1Z5\nItem 1: 100.00\nItem 2: 200.00\nItem 3: 150.00\nTax: 45.00\nNet Total: 495.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['merchant'], 'Flipkart Supermart')
        self.assertEqual(res['amount'], '495.00')

    def test_case_6_receipt_with_tax(self):
        text = "Pizza Hut\nSubtotal: 500.00\nCGST 2.5%: 12.50\nSGST 2.5%: 12.50\nAmount Payable: ₹525.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '525.00')
        self.assertEqual(res['category'], 'Food & Dining')

    def test_case_7_receipt_with_discount(self):
        text = "Amazon Retail Store\nSubtotal: 1000.00\nDiscount: -200.00\nTotal Due: 800.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '800.00')
        self.assertEqual(res['category'], 'Shopping')

    def test_case_8_receipt_with_inr_symbol(self):
        text = "State Electricity Power\nBill Date: 2026-08-01\nTotal Amount Payable: Rs. 1250.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '1250.00')
        self.assertEqual(res['category'], 'Utilities')

    def test_case_9_receipt_with_decimal(self):
        text = "Burger King\nTotal: 299.50"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '299.50')

    def test_case_10_multiple_numeric_values(self):
        text = "Store 402\nCashier 12\nPhone 9876543210\nItem A: 12.00\nItem B: 45.00\nGrand Total: 57.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '57.00')

    def test_case_11_non_receipt_image(self):
        text = "Random photo with no text or monetary amounts"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '')
        self.assertEqual(res['confidence']['overall'], 'Low')

    def test_case_12_empty_image(self):
        text = ""
        res = parse_receipt_text_python(text)
        self.assertEqual(res['merchant'], 'Unreadable Merchant')
        self.assertEqual(res['amount'], '')
        self.assertEqual(res['confidence']['overall'], 'Low')

    def test_case_13_low_quality_image(self):
        text = "x9832 7483\n...---...\n12.50"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '12.50')

    def test_case_14_different_merchant_layouts(self):
        text = "WELCOME TO OLA CABS\nINVOICE #99812\nDate: 2026-08-11\nTotal Paid: ₹320.00"
        res = parse_receipt_text_python(text)
        self.assertEqual(res['amount'], '320.00')
        self.assertEqual(res['category'], 'Transport')

if __name__ == '__main__':
    unittest.main()

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';
import CommandPalette from '../common/CommandPalette';
import AiAssistantModal from '../AI/AiAssistantModal';
import ReceiptScannerModal from '../AI/ReceiptScannerModal';
import CurrencyConverterModal from '../Finance/CurrencyConverterModal';
import CentralCreateModal from '../common/CentralCreateModal';
import { FaRobot, FaBars, FaTimes } from 'react-icons/fa';

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Tool Modals
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isModalOpen = showCmdPalette || showAiAssistant || showReceiptScanner || showCurrencyModal || showQuickAdd;

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="mobile-toggle-btn"
        title="Toggle Menu"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop / Mobile Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCmdPalette={() => setShowCmdPalette(true)}
        onOpenAi={() => setShowAiAssistant(true)}
      />

      {/* Main Content Area */}
      <main className="content-with-sidebar">
        <Outlet />
      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNavbar
        onOpenQuickAdd={() => setShowQuickAdd(true)}
        onOpenAi={() => setShowAiAssistant(true)}
      />

      {/* Floating AI Assistant Trigger Button (Hidden when a modal is open) */}
      {!isModalOpen && (
        <button
          className="floating-ai-btn"
          onClick={() => setShowAiAssistant(true)}
          title="Ask FinAI Assistant (Cmd+K)"
          style={{ zIndex: 600 }}
        >
          <FaRobot />
        </button>
      )}

      {/* Global Modals */}
      <CommandPalette
        isOpen={showCmdPalette}
        onClose={() => setShowCmdPalette(false)}
        onOpenAi={() => setShowAiAssistant(true)}
        onOpenAddModal={() => setShowQuickAdd(true)}
        onOpenCurrencyModal={() => setShowCurrencyModal(true)}
        onOpenReceiptScanner={() => setShowReceiptScanner(true)}
      />

      <AiAssistantModal
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
      />

      <CentralCreateModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />

      <ReceiptScannerModal
        isOpen={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
      />

      <CurrencyConverterModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </div>
  );
};

export default UserLayout;

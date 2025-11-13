'use client';

import { useState, useEffect } from 'react';
import { useResponsive } from './use-responsive';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  toggleCollapse: () => void;
  collapse: () => void;
  expand: () => void;
}

export function useSidebar(): SidebarState {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const toggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const open = () => {
    if (isMobile) {
      setIsOpen(true);
    } else {
      setIsCollapsed(false);
    }
  };

  const close = () => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsCollapsed(true);
    }
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const collapse = () => {
    if (!isMobile) {
      setIsCollapsed(true);
    }
  };

  const expand = () => {
    if (!isMobile) {
      setIsCollapsed(false);
    }
  };

  return {
    isOpen,
    isCollapsed,
    isMobile,
    toggle,
    open,
    close,
    toggleCollapse,
    collapse,
    expand
  };
}

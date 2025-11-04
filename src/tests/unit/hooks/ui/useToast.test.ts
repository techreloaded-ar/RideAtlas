/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/ui/useToast';

// Setup a global container for all tests
let globalContainer: HTMLDivElement;

describe('useToast Hook', () => {
  beforeEach(() => {
    // Create a fresh container for each test
    globalContainer = document.createElement('div');
    globalContainer.setAttribute('data-testid', 'toast-container');
    document.body.appendChild(globalContainer);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up all toast elements from DOM
    document.querySelectorAll('div[class*="bg-green-500"], div[class*="bg-red-500"], div[class*="bg-yellow-500"], div[class*="bg-blue-500"]')
      .forEach(el => el.remove());
    
    // Cleanup container
    if (globalContainer && document.body.contains(globalContainer)) {
      document.body.removeChild(globalContainer);
    }
    
    // Restore all mocks and timers
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should return toast methods', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    expect(typeof result.current.showSuccess).toBe('function');
    expect(typeof result.current.showError).toBe('function');
    expect(typeof result.current.showWarning).toBe('function');
    expect(typeof result.current.showInfo).toBe('function');
  });

  it('should create and append success toast to DOM', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showSuccess('Success message');
    });

    // Check if toast was added to DOM
    const toastElements = document.querySelectorAll('div[class*="bg-green-500"]');
    expect(toastElements.length).toBe(1);
    
    const toast = toastElements[0] as HTMLElement;
    expect(toast.textContent).toBe('Success message');
    expect(toast.className).toContain('fixed');
    expect(toast.className).toContain('top-4');
    expect(toast.className).toContain('right-4');
    expect(toast.className).toContain('bg-green-500');
  });

  it('should create error toast with red background', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showError('Error message');
    });

    const toastElements = document.querySelectorAll('div[class*="bg-red-500"]');
    expect(toastElements.length).toBe(1);
    
    const toast = toastElements[0] as HTMLElement;
    expect(toast.textContent).toBe('Error message');
  });

  it('should create warning toast with yellow background', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showWarning('Warning message');
    });

    const toastElements = document.querySelectorAll('div[class*="bg-yellow-500"]');
    expect(toastElements.length).toBe(1);
    
    const toast = toastElements[0] as HTMLElement;
    expect(toast.textContent).toBe('Warning message');
  });

  it('should create info toast with blue background', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showInfo('Info message');
    });

    const toastElements = document.querySelectorAll('div[class*="bg-blue-500"]');
    expect(toastElements.length).toBe(1);
    
    const toast = toastElements[0] as HTMLElement;
    expect(toast.textContent).toBe('Info message');
  });

  it('should handle multiple toasts simultaneously', () => {
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showSuccess('Success 1');
      result.current.showError('Error 1');
      result.current.showInfo('Info 1');
    });

    // Should have 3 different toasts with different colors
    expect(document.querySelectorAll('div[class*="bg-green-500"]').length).toBe(1);
    expect(document.querySelectorAll('div[class*="bg-red-500"]').length).toBe(1);
    expect(document.querySelectorAll('div[class*="bg-blue-500"]').length).toBe(1);
  });


  it('should handle toast auto-removal with timeouts', async () => {
    // Mock timers to control timeout execution
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useToast(), {
      container: globalContainer
    });

    act(() => {
      result.current.showSuccess('Auto remove test');
    });

    // Toast should be present initially
    let toastElements = document.querySelectorAll('div[class*="bg-green-500"]');
    expect(toastElements.length).toBe(1);

    // Fast-forward 3 seconds (first timeout)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Toast should have transform and opacity styles applied
    const toast = toastElements[0] as HTMLElement;
    expect(toast.style.transform).toBe('translateX(100%)');
    expect(toast.style.opacity).toBe('0');

    // Fast-forward additional 300ms (second timeout)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Toast should be removed from DOM
    toastElements = document.querySelectorAll('div[class*="bg-green-500"]');
    expect(toastElements.length).toBe(0);

    jest.useRealTimers();
  });
  
});
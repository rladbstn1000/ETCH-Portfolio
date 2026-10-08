// 성능 측정 유틸리티
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: { [key: string]: number } = {};

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 컴포넌트 렌더링 시간 측정
  measureComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.metrics[`${componentName}_render`] = endTime - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`🔍 ${componentName} 렌더링 시간: ${(endTime - startTime).toFixed(2)}ms`);
    }
  }

  // API 호출 시간 측정
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      this.metrics[`${apiName}_api`] = endTime - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`🌐 ${apiName} API 응답 시간: ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.metrics[`${apiName}_api_error`] = endTime - startTime;
      throw error;
    }
  }

  // Core Web Vitals 측정
  measureCoreWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
          this.metrics.fcp = entry.startTime;
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`🖼️ LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      this.metrics.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // 현재까지 수집된 모든 메트릭 출력
  getMetricsReport(): { [key: string]: number } {
    return { ...this.metrics };
  }

  // 메트릭을 서버로 전송 (선택사항)
  sendMetricsToServer(endpoint: string) {
    if (Object.keys(this.metrics).length > 0) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(console.error);
    }
  }
}

// React Hook으로 사용
export const usePerformanceMonitor = () => {
  return PerformanceMonitor.getInstance();
};
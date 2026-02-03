import { metrics } from '../src/utils/metrics';

describe('Metrics Collector', () => {
  beforeEach(() => {
    metrics.reset();
  });

  it('should increment counters', () => {
    metrics.incrementCounter('test_counter', 1);
    metrics.incrementCounter('test_counter', 2);

    expect(metrics.getCounter('test_counter')).toBe(3);
  });

  it('should set gauges', () => {
    metrics.setGauge('test_gauge', 42);
    metrics.setGauge('test_gauge', 100);

    expect(metrics.getGauge('test_gauge')).toBe(100);
  });

  it('should record histogram values', () => {
    metrics.recordHistogram('test_histogram', 10);
    metrics.recordHistogram('test_histogram', 20);
    metrics.recordHistogram('test_histogram', 30);

    const histogram = metrics.getHistogram('test_histogram');
    expect(histogram).toBeDefined();
    expect(histogram!.count).toBe(3);
    expect(histogram!.sum).toBe(60);
    expect(histogram!.min).toBe(10);
    expect(histogram!.max).toBe(30);
  });

  it('should support labels', () => {
    metrics.incrementCounter('requests', 1, { method: 'GET', status: '200' });
    metrics.incrementCounter('requests', 1, { method: 'POST', status: '201' });
    metrics.incrementCounter('requests', 2, { method: 'GET', status: '200' });

    expect(metrics.getCounter('requests', { method: 'GET', status: '200' })).toBe(3);
    expect(metrics.getCounter('requests', { method: 'POST', status: '201' })).toBe(1);
  });

  it('should get all metrics', () => {
    metrics.incrementCounter('counter1', 5);
    metrics.setGauge('gauge1', 10);
    metrics.recordHistogram('histogram1', 15);

    const all = metrics.getAllMetrics();

    expect(all.counters).toHaveProperty('counter1', 5);
    expect(all.gauges).toHaveProperty('gauge1', 10);
    expect(all.histograms).toHaveProperty('histogram1');
  });

  it('should reset all metrics', () => {
    metrics.incrementCounter('test', 1);
    metrics.setGauge('test2', 2);
    metrics.reset();

    expect(metrics.getCounter('test')).toBe(0);
    expect(metrics.getGauge('test2')).toBeUndefined();
  });
});

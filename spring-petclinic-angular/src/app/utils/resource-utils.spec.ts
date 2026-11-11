import {ApplicationRef, resource} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {valueOrDefault} from './resource-utils';

describe('valueOrDefault', () => {
  it('should return the loaded value', async () => {
    const loaded = TestBed.runInInjectionContext(() => resource({
      loader: async () => 'loaded'
    }));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(valueOrDefault(loaded, 'fallback')).toBe('loaded');
  });
});

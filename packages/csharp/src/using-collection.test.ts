import { describe, expect, it } from 'vitest';

import { StringBuilder } from '@goast/core';

import { UsingCollection } from './using-collection.ts';

describe('UsingCollection', () => {
  describe('hasUsings', () => {
    it('should return false when no usings are added', () => {
      expect(new UsingCollection().hasUsings).toBe(false);
    });

    it('should return true when usings are added', () => {
      const usings = new UsingCollection();
      usings.addUsing('System');
      expect(usings.hasUsings).toBe(true);
    });

    it('should return false when all usings are filtered out', () => {
      const usings = new UsingCollection({ globalUsings: ['System'] });
      usings.addUsing('System');
      expect(usings.hasUsings).toBe(false);
    });
  });

  describe('addUsing', () => {
    it('should add a namespace only once', () => {
      const usings = new UsingCollection();
      usings.addUsing('My.Namespace');
      usings.addUsing('My.Namespace');
      expect(usings.usings).toEqual(['My.Namespace']);
    });

    it('should ignore empty namespaces', () => {
      const usings = new UsingCollection();
      usings.addUsing('');
      expect(usings.usings).toEqual([]);
    });
  });

  describe('addUsings', () => {
    it('should add multiple namespaces', () => {
      const usings = new UsingCollection();
      usings.addUsings(['B.Namespace', 'A.Namespace']);
      expect(usings.usings).toEqual(['A.Namespace', 'B.Namespace']);
    });
  });

  describe('clear', () => {
    it('should clear all usings', () => {
      const usings = new UsingCollection();
      usings.addUsing('System');
      usings.clear();
      expect(usings.usings).toEqual([]);
    });
  });

  describe('ordering', () => {
    it('should sort System namespaces first and everything else alphabetically', () => {
      const usings = new UsingCollection();
      usings.addUsings([
        'Microsoft.AspNetCore.Mvc',
        'System.Text.Json',
        'Acme.Models',
        'System',
        'System.Collections.Generic',
        'SystemFoo',
      ]);
      expect(usings.usings).toEqual([
        'System',
        'System.Collections.Generic',
        'System.Text.Json',
        'Acme.Models',
        'Microsoft.AspNetCore.Mvc',
        'SystemFoo',
      ]);
    });
  });

  describe('filtering', () => {
    it('should ignore global usings', () => {
      const usings = new UsingCollection({ globalUsings: ['System', 'System.Linq'] });
      usings.addUsings(['System', 'System.Linq', 'System.Text']);
      expect(usings.usings).toEqual(['System.Text']);
    });

    it('should ignore the namespace of the file and its parent namespaces', () => {
      const usings = new UsingCollection({ namespace: 'Acme.Api.Models' });
      usings.addUsings(['Acme', 'Acme.Api', 'Acme.Api.Models', 'Acme.Api.Models.Sub', 'Acme.Other', 'Acme.ApiX']);
      expect(usings.usings).toEqual(['Acme.Api.Models.Sub', 'Acme.ApiX', 'Acme.Other']);
    });
  });

  describe('toString', () => {
    it('should return an empty string when no usings are added', () => {
      expect(new UsingCollection().toString()).toBe('');
    });

    it('should return a string of usings', () => {
      const usings = new UsingCollection();
      usings.addUsings(['Acme', 'System']);
      // A fixed newLine keeps the expectation below host-independent.
      expect(usings.toString({ newLine: '\n' })).toBe('using System;\nusing Acme;\n');
    });
  });

  describe('writeTo', () => {
    it('should write usings to a StringBuilder', () => {
      const usings = new UsingCollection();
      usings.addUsings(['Acme', 'System']);
      const builder = new StringBuilder({ newLine: '\n' });
      usings.writeTo(builder);
      expect(builder.toString()).toBe('using System;\nusing Acme;\n');
    });
  });
});

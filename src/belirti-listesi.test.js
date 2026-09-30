import { describe, expect, it } from 'vitest';
import { symptomsFor } from './screen-content.jsx';

describe('perimenopoz belirtileri', () => {
  const liste = symptomsFor('perimeno');

  it('baş ağrısı listede', () => {
    expect(liste.find(s => s.key === 'headache')).toMatchObject({ label: 'Headache', labelTr: 'Baş ağrısı' });
  });

  it('anahtarlar tekil — aynı belirti iki kez sorulmuyor', () => {
    const k = liste.map(s => s.key);
    expect(new Set(k).size).toBe(k.length);
  });
});

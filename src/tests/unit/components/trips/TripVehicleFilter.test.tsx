import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripVehicleFilter from '@/components/trips/TripVehicleFilter';

describe('TripVehicleFilter', () => {
  it('offre Tutti e i quattro mezzi', () => {
    render(<TripVehicleFilter value={null} onChange={jest.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    for (const name of ['Tutti', 'Moto', 'Bici', 'E-bike', 'Monopattino']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Tutti' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('click su Monopattino chiama onChange con MONOPATTINO', async () => {
    const onChange = jest.fn();
    render(<TripVehicleFilter value={null} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Monopattino' }));
    expect(onChange).toHaveBeenCalledWith('MONOPATTINO');
  });

  it('segna come premuto il mezzo selezionato e lo deseleziona al click', async () => {
    const onChange = jest.fn();
    render(<TripVehicleFilter value="BICI" onChange={onChange} />);
    const bici = screen.getByRole('button', { name: 'Bici' });
    expect(bici).toHaveAttribute('aria-pressed', 'true');
    await userEvent.setup().click(bici);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

import { render, screen, fireEvent } from '../../setup/test-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TripFormFields } from '@/components/trips/TripFormFields';
import { tripWithStagesSchema, type TripWithStagesData } from '@/schemas/trip';

const Wrapper = ({ characteristics = [] }: { characteristics?: TripWithStagesData['characteristics'] }) => {
  const form = useForm<TripWithStagesData>({
    resolver: zodResolver(tripWithStagesSchema),
    defaultValues: {
      title: '',
      summary: '',
      destination: '',
      theme: '',
      characteristics,
      recommended_seasons: [],
      tags: [],
      media: [],
      gpxFile: null,
      stages: [],
    },
  });
  return <TripFormFields form={form} />;
};

const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement;
const checkbox = (name: string) => screen.getByLabelText(name) as HTMLInputElement;

describe('TripFormFields - mezzo di trasporto', () => {
  it('mostra i 4 mezzi con Moto selezionato di default', () => {
    render(<Wrapper />);
    ['Moto', 'Bici', 'E-bike', 'Monopattino'].forEach((n) => expect(radio(n)).toBeInTheDocument());
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(radio('Moto').checked).toBe(true);
  });

  it('seleziona il mezzo cliccato', () => {
    render(<Wrapper />);
    fireEvent.click(radio('Monopattino'));
    expect(radio('Monopattino').checked).toBe(true);
    expect(radio('Moto').checked).toBe(false);
  });

  it('con un mezzo non moto nasconde le caratteristiche solo moto', () => {
    render(<Wrapper />);
    fireEvent.click(radio('Monopattino'));
    expect(screen.queryByLabelText('Autostrada')).toBeNull();
    expect(screen.queryByLabelText('Presenza pedaggi')).toBeNull();
    expect(screen.getByLabelText('Bel paesaggio')).toBeInTheDocument();
    expect(screen.getByLabelText('Strade sterrate')).toBeInTheDocument();
  });

  it('cambiando mezzo rimuove la selezione incoerente e la lascia deselezionata al ritorno', () => {
    render(<Wrapper characteristics={['Autostrada', 'Bel paesaggio']} />);
    expect(checkbox('Autostrada').checked).toBe(true);
    fireEvent.click(radio('Bici'));
    expect(checkbox('Bel paesaggio').checked).toBe(true);
    expect(screen.queryByLabelText('Autostrada')).toBeNull();
    fireEvent.click(radio('Moto'));
    expect(checkbox('Autostrada').checked).toBe(false);
  });
});

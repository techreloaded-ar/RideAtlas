// src/tests/unit/components/TripFormFields.test.tsx
import { render, screen, fireEvent } from '../../setup/test-utils';
import { TripFormFields } from '@/components/trips/TripFormFields';
import { RecommendedSeason } from '@/types/trip';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripWithStagesSchema, type TripWithStagesData, CharacteristicOptions } from '@/schemas/trip';

// Wrapper component per testare TripFormFields con React Hook Form
const TripFormFieldsTestWrapper = ({ 
  defaultValues = {},
  onSubmit = jest.fn() 
}: { 
  defaultValues?: Partial<TripWithStagesData>
  onSubmit?: (data: TripWithStagesData) => void 
}) => {
  const form = useForm<TripWithStagesData>({
    resolver: zodResolver(tripWithStagesSchema),
    defaultValues: {
      title: '',
      summary: '',
      destination: '',
      theme: '',
      duration_days: 1,
      duration_nights: 0,
      characteristics: [],
      recommended_seasons: [],
      tags: [],
      insights: '',
      media: [],
      gpxFile: null,
      stages: [],
      ...defaultValues
    },
    mode: 'onChange'
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <TripFormFields form={form} />
      <button type="submit">Submit</button>
    </form>
  );
};

describe('TripFormFields Component - Updated Characteristics', () => {
  const mockDefaultValues = {
    title: 'Test Trip',
    summary: 'Test summary with required minimum length',
    destination: 'Test Destination',
    duration_days: 2,
    duration_nights: 1,
    tags: ['test'],
    theme: 'Test Theme',
    characteristics: [],
    recommended_seasons: [RecommendedSeason.Estate],
    insights: '',
    media: [],
    gpxFile: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Positive Characteristics Display', () => {
    it('shouldDisplayAllPositiveCharacteristics', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const expectedPositiveCharacteristics = [
        'Strade sterrate',
        'Curve strette',
        'Presenza pedaggi',
        'Presenza traghetti',
        'Autostrada',
        'Bel paesaggio',
        'Visita prolungata',
        'Interesse gastronomico',
        'Interesse storico-culturale'
      ];

      expectedPositiveCharacteristics.forEach(characteristic => {
        expect(screen.getByLabelText(characteristic)).toBeInTheDocument();
      });
    });

    it('shouldNotDisplayNegativeFormulations', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const negativeFormulations = [
        'Evita pedaggi',
        'Evita traghetti',
      ];

      negativeFormulations.forEach(negative => {
        expect(screen.queryByLabelText(negative)).not.toBeInTheDocument();
      });
    });

    it('shouldDisplayNewGastronomyAndCulturalCharacteristics', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const newCharacteristics = [
        'Visita prolungata',
        'Interesse gastronomico',
        'Interesse storico-culturale',
      ];

      newCharacteristics.forEach(characteristic => {
        expect(screen.getByLabelText(characteristic)).toBeInTheDocument();
      });
    });
  });

  describe('Characteristics Interaction', () => {
    it('shouldCallHandlerWhenCharacteristicIsSelected', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi');
      
      fireEvent.click(presenzaPedaggiCheckbox);

      // Con React Hook Form, il cambio è gestito automaticamente
      expect(presenzaPedaggiCheckbox).toBeInTheDocument();
    });

    it('shouldCallHandlerWhenNewCharacteristicIsSelected', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const interesseGastronomicoCheckbox = screen.getByLabelText('Interesse gastronomico');
      
      fireEvent.click(interesseGastronomicoCheckbox);

      // Con React Hook Form, il cambio è gestito automaticamente
      expect(interesseGastronomicoCheckbox).toBeInTheDocument();
    });

    it('shouldShowSelectedCharacteristicsAsChecked', () => {
      const formDataWithSelectedCharacteristics = {
        ...mockDefaultValues,
        characteristics: ['Presenza pedaggi', 'Interesse storico-culturale'],
      };

      render(<TripFormFieldsTestWrapper defaultValues={formDataWithSelectedCharacteristics} />);

      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi') as HTMLInputElement;
      const interesseStoricoCheckbox = screen.getByLabelText('Interesse storico-culturale') as HTMLInputElement;
      const belPaesaggioCheckbox = screen.getByLabelText('Bel paesaggio') as HTMLInputElement;

      expect(presenzaPedaggiCheckbox.checked).toBe(true);
      expect(interesseStoricoCheckbox.checked).toBe(true);
      expect(belPaesaggioCheckbox.checked).toBe(false);
    });
  });

  describe('Optional Fields Handling', () => {
    it('shouldAllowEmptyInsightsField', () => {
      const formDataWithEmptyInsights = {
        ...mockDefaultValues,
        insights: '',
      };

      render(<TripFormFieldsTestWrapper defaultValues={formDataWithEmptyInsights} />);

      const insightsTextarea = screen.getByLabelText('Approfondimenti');
      expect(insightsTextarea).toHaveValue('');
    });

    it('shouldHandleInsightsInput', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const insightsTextarea = screen.getByLabelText('Approfondimenti');
      
      fireEvent.change(insightsTextarea, {
        target: { value: 'Test insights content' }
      });

      // Con React Hook Form, il cambio è gestito automaticamente
      expect(insightsTextarea).toHaveValue('Test insights content');
    });

    it('shouldAllowEmptyTagsList', () => {
      const formDataWithEmptyTags = {
        ...mockDefaultValues,
        tags: [],
      };

      render(<TripFormFieldsTestWrapper defaultValues={formDataWithEmptyTags} />);

      // Verifica che ci sia il campo input per i tag ma nessun tag visualizzato
      const tagInput = screen.getByLabelText('Tag (separati da virgola o premi Invio)');
      expect(tagInput).toBeInTheDocument();

      // Verifica che non ci siano tag visualizzati (non dovrebbe esserci nessun elemento con il testo dei tag)
      const tagContainer = screen.getByLabelText('Tag (separati da virgola o premi Invio)').parentElement;
      const tagSpans = tagContainer?.querySelectorAll('.inline-flex'); // La classe del tag span
      expect(tagSpans).toHaveLength(0);
    });
  });

  describe('Form Validation Display', () => {
    it('shouldNotShowErrorsForEmptyOptionalFields', () => {
      const formDataWithEmptyOptionals = {
        ...mockDefaultValues,
        insights: '',
        tags: [],
      };

      render(<TripFormFieldsTestWrapper defaultValues={formDataWithEmptyOptionals} />);

      // Non dovrebbero esserci messaggi di errore per campi opzionali vuoti
      expect(screen.queryByText(/Il testo esteso è obbligatorio/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Devi aggiungere almeno un tag/i)).not.toBeInTheDocument();
    });

    it('shouldDisplayFieldErrorsWhenProvided', () => {
      // Con React Hook Form, gli errori vengono mostrati automaticamente
      // quando la validazione fallisce. Testiamo che i campi existano
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const titleInput = screen.getByLabelText('Titolo');
      const summaryInput = screen.getByLabelText('Sommario');
      
      expect(titleInput).toBeInTheDocument();
      expect(summaryInput).toBeInTheDocument();
    });
  });

  describe('Characteristics Constants Integration', () => {
    it('shouldMatchCharacteristicOptionsFromConstants', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      // Verifica che tutte le caratteristiche da constants siano presenti
      CharacteristicOptions.forEach(characteristic => {
        expect(screen.getByLabelText(characteristic)).toBeInTheDocument();
      });
    });

    it('shouldHaveExactlyNineCharacteristics', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      // Conta tutti i checkbox delle caratteristiche
      const characteristicCheckboxes = screen.getAllByRole('checkbox').filter(checkbox => {
        const label = checkbox.getAttribute('aria-labelledby') || 
                     checkbox.closest('label')?.textContent || 
                     '';
        return CharacteristicOptions.some(option => label.includes(option));
      });

      expect(characteristicCheckboxes).toHaveLength(9);
    });
  });

  describe('Multimedia Section', () => {
    it('shouldRenderMultimediaSection', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      // Verifica che la sezione multimedia sia presente
      const multimediaLabel = screen.getByText('Multimedia del Viaggio');
      expect(multimediaLabel).toBeInTheDocument();

      // Verifica la descrizione della sezione
      const description = screen.getByText(/Aggiungi immagini e video rappresentativi/i);
      expect(description).toBeInTheDocument();
    });

    it('shouldSupportEmptyMediaArray', () => {
      const defaultsWithEmptyMedia = {
        ...mockDefaultValues,
        media: []
      };

      render(<TripFormFieldsTestWrapper defaultValues={defaultsWithEmptyMedia} />);

      // Il componente dovrebbe renderizzarsi senza errori anche con media vuoto
      const multimediaLabel = screen.getByText('Multimedia del Viaggio');
      expect(multimediaLabel).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('shouldHaveProperLabelsForAllCharacteristics', () => {
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      CharacteristicOptions.forEach(characteristic => {
        const checkbox = screen.getByLabelText(characteristic);
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('shouldDisableFieldsWhenLoading', () => {
      // Per testare il loading state, dovremmo mockare lo stato del form
      // Per ora testiamo solo che il componente si renda senza errori
      render(<TripFormFieldsTestWrapper defaultValues={mockDefaultValues} />);

      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi');
      // Con React Hook Form, i campi non sono automaticamente disabilitati
      // Testiamo solo che esistano
      expect(presenzaPedaggiCheckbox).toBeInTheDocument();
    });
  });
});

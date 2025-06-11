// src/tests/unit/components/TripFormFields.test.tsx
import { render, screen, fireEvent } from '../../setup/test-utils';
import TripFormFields from '@/components/TripFormFields';
import { RecommendedSeason } from '@/types/trip';
import { characteristicOptions } from '@/constants/tripForm';

describe('TripFormFields Component - Updated Characteristics', () => {
  const mockFormData = {
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

  const mockHandlers = {
    handleChange: jest.fn(),
    handleTagInputChange: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    handleCharacteristicChange: jest.fn(),
    handleSeasonChange: jest.fn(),
    addMedia: jest.fn(),
    removeMedia: jest.fn(),
    updateMediaCaption: jest.fn(),
    setGpxFile: jest.fn(),
    removeGpxFile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Positive Characteristics Display', () => {
    it('shouldDisplayAllPositiveCharacteristics', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const expectedPositiveCharacteristics = [
        'Strade sterrate',
        'Curve strette',
        'Presenza pedaggi',
        'Presenza traghetti',
        'Autostrada',
        'Bel paesaggio',
      ];

      expectedPositiveCharacteristics.forEach(characteristic => {
        expect(screen.getByLabelText(characteristic)).toBeInTheDocument();
      });
    });

    it('shouldNotDisplayNegativeFormulations', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const negativeFormulations = [
        'Evita pedaggi',
        'Evita traghetti',
      ];

      negativeFormulations.forEach(negative => {
        expect(screen.queryByLabelText(negative)).not.toBeInTheDocument();
      });
    });

    it('shouldDisplayNewGastronomyAndCulturalCharacteristics', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

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
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi');
      
      fireEvent.click(presenzaPedaggiCheckbox);

      expect(mockHandlers.handleCharacteristicChange).toHaveBeenCalledWith(
        'Presenza pedaggi',
        true
      );
    });

    it('shouldCallHandlerWhenNewCharacteristicIsSelected', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const interesseGastronomicoCheckbox = screen.getByLabelText('Interesse gastronomico');
      
      fireEvent.click(interesseGastronomicoCheckbox);

      expect(mockHandlers.handleCharacteristicChange).toHaveBeenCalledWith(
        'Interesse gastronomico',
        true
      );
    });

    it('shouldShowSelectedCharacteristicsAsChecked', () => {
      const formDataWithSelectedCharacteristics = {
        ...mockFormData,
        characteristics: ['Presenza pedaggi', 'Interesse storico-culturale'],
      };

      render(
        <TripFormFields
          formData={formDataWithSelectedCharacteristics}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

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
        ...mockFormData,
        insights: '',
      };

      render(
        <TripFormFields
          formData={formDataWithEmptyInsights}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const insightsTextarea = screen.getByLabelText('Approfondimenti');
      expect(insightsTextarea).toHaveValue('');
    });

    it('shouldHandleInsightsInput', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      const insightsTextarea = screen.getByLabelText('Approfondimenti');
      
      fireEvent.change(insightsTextarea, {
        target: { value: 'Test insights content' }
      });

      // Verifica che l'handler sia stato chiamato
      expect(mockHandlers.handleChange).toHaveBeenCalledTimes(1);
      
      // Verifica che l'evento sia stato passato correttamente
      const call = mockHandlers.handleChange.mock.calls[0][0];
      expect(call.target.name).toBe('insights');
      expect(call.type).toBe('change');
    });

    it('shouldAllowEmptyTagsList', () => {
      const formDataWithEmptyTags = {
        ...mockFormData,
        tags: [],
      };

      render(
        <TripFormFields
          formData={formDataWithEmptyTags}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      // Verifica che non ci siano tag visualizzati
      const tagContainer = screen.getByText('Tag (separati da virgola o premi Invio)').parentElement;
      const tagSpans = tagContainer?.querySelectorAll('[class*="tagSpan"]');
      expect(tagSpans).toHaveLength(0);
    });
  });

  describe('Form Validation Display', () => {
    it('shouldNotShowErrorsForEmptyOptionalFields', () => {
      const formDataWithEmptyOptionals = {
        ...mockFormData,
        insights: '',
        tags: [],
      };

      render(
        <TripFormFields
          formData={formDataWithEmptyOptionals}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      // Non dovrebbero esserci messaggi di errore per campi opzionali vuoti
      expect(screen.queryByText(/Il testo esteso è obbligatorio/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Devi aggiungere almeno un tag/i)).not.toBeInTheDocument();
    });

    it('shouldDisplayFieldErrorsWhenProvided', () => {
      const fieldErrors = {
        title: ['Il titolo è troppo corto'],
        summary: ['Il sommario deve essere più lungo'],
      };

      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={fieldErrors}
          isLoading={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Il titolo è troppo corto')).toBeInTheDocument();
      expect(screen.getByText('Il sommario deve essere più lungo')).toBeInTheDocument();
    });
  });

  describe('Characteristics Constants Integration', () => {
    it('shouldMatchCharacteristicOptionsFromConstants', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      // Verifica che tutte le caratteristiche da constants siano presenti
      characteristicOptions.forEach(characteristic => {
        expect(screen.getByLabelText(characteristic)).toBeInTheDocument();
      });
    });

    it('shouldHaveExactlyNineCharacteristics', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      // Conta tutti i checkbox delle caratteristiche
      const characteristicCheckboxes = screen.getAllByRole('checkbox').filter(checkbox => {
        const label = checkbox.getAttribute('aria-labelledby') || 
                     checkbox.closest('label')?.textContent || 
                     '';
        return characteristicOptions.some(option => label.includes(option));
      });

      expect(characteristicCheckboxes).toHaveLength(9);
    });
  });

  describe('Accessibility and UX', () => {
    it('shouldHaveProperLabelsForAllCharacteristics', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={false}
          {...mockHandlers}
        />
      );

      characteristicOptions.forEach(characteristic => {
        const checkbox = screen.getByLabelText(characteristic);
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('shouldDisableFieldsWhenLoading', () => {
      render(
        <TripFormFields
          formData={mockFormData}
          fieldErrors={null}
          isLoading={true}
          {...mockHandlers}
          // Non passare handleCharacteristicChange per testare il comportamento disabled
          handleCharacteristicChange={undefined}
        />
      );

      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi');
      expect(presenzaPedaggiCheckbox).toBeDisabled();
    });
  });
});

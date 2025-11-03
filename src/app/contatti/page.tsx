'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormData } from '@/schemas/contact';

// Metadata viene gestito tramite l'export metadata nei file non client
// Per ora il titolo verrà gestito dal layout root

export default function ContattiPage() {
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.simulated
            ? 'Messaggio simulato con successo! (Modalità sviluppo)'
            : 'Messaggio inviato con successo! Ti risponderemo al più presto.',
        });
        reset();
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Si è verificato un errore. Riprova più tardi.',
        });
      }
    } catch (error) {
      console.error('Errore durante l\'invio:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Errore di connessione. Verifica la tua connessione e riprova.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contatti</h1>

      <div className="prose prose-gray max-w-none mb-8">
        <p className="text-gray-600 mb-6">
          Hai domande, suggerimenti o vuoi semplicemente metterti in contatto con noi?
          Compila il form qui sotto e ti risponderemo al più presto!
        </p>

        <section className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Informazioni di Contatto</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Email:</strong>{' '}
              <a href="mailto:info@rideatlas.it" className="text-purple-600 hover:text-purple-800 hover:underline">
                info@rideatlas.it
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Inviaci un messaggio</h2>

        {submitStatus.type && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              submitStatus.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p className="font-medium">{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              type="text"
              {...register('nome')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Il tuo nome"
              disabled={isSubmitting}
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
            )}
          </div>

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="tua.email@esempio.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Campo Messaggio */}
          <div>
            <label htmlFor="messaggio" className="block text-sm font-medium text-gray-700 mb-2">
              Messaggio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="messaggio"
              {...register('messaggio')}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-vertical ${
                errors.messaggio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Scrivi qui il tuo messaggio..."
              disabled={isSubmitting}
            />
            {errors.messaggio && (
              <p className="mt-1 text-sm text-red-600">{errors.messaggio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimo 10 caratteri, massimo 2000 caratteri
            </p>
          </div>

          {/* Pulsante Submit */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Invio in corso...
                </span>
              ) : (
                'Invia Messaggio'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>I campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori</p>
      </div>
    </div>
  );
}

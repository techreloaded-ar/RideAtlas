import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { BatchProcessingResult } from '@/schemas/batch-trip'
import { ErrorUtils } from '@/lib/batch/ErrorUtils'

interface BatchErrorDisplayProps {
  errors: BatchProcessingResult['errors']
  title?: string
  showHelpLinks?: boolean
}

export const BatchErrorDisplay = ({ 
  errors, 
  title = "Errori da Risolvere" 
}: BatchErrorDisplayProps) => {
  if (errors.length === 0) return null

  const categorizedErrors = ErrorUtils.getCategorizedErrors(errors)

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-red-900 flex items-center space-x-2">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <span>{title} ({errors.length})</span>
      </h4>
      
      <div className="space-y-3">
        {categorizedErrors.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-red-50 border border-red-200 rounded-lg">
            <div className="px-4 py-2 bg-red-100 rounded-t-lg">
              <h5 className="text-sm font-semibold text-red-900 flex items-center space-x-2">
                <span>{ErrorUtils.getCategoryIcon(category.type)}</span>
                <span>{ErrorUtils.getCategoryTitle(category.type)} ({category.errors.length})</span>
              </h5>
            </div>
            
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              {category.errors.map((error: BatchProcessingResult['errors'][0], errorIndex: number) => (
                <div key={errorIndex} className="bg-white border border-red-200 rounded-md p-3">
                  <div className="space-y-2">
                    {/* Error Location */}
                    {(error.tripIndex !== undefined || error.stageIndex !== undefined || error.field) && (
                      <div className="text-xs text-red-600 font-medium">
                        {error.tripIndex !== undefined && `📍 Viaggio ${error.tripIndex + 1}`}
                        {error.stageIndex !== undefined && ` → Tappa ${error.stageIndex + 1}`}
                        {error.field && ` → Campo: ${error.field}`}
                      </div>
                    )}
                    
                    {/* Error Message */}
                    <div className="text-sm text-red-800 font-medium">
                      🚫 {error.message || 'Errore durante il processamento'}
                    </div>
                    
                    {/* Suggestion */}
                    {ErrorUtils.getErrorSuggestion(error) && (
                      <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                        <div className="font-medium">💡 Come risolvere:</div>
                        <div>{ErrorUtils.getErrorSuggestion(error)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
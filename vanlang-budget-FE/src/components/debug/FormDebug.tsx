'use client'

import { UseFormReturn } from 'react-hook-form'

interface FormDebugProps {
    form: UseFormReturn<any>
    title?: string
}

export default function FormDebug({ form, title = 'Form Debug' }: FormDebugProps) {
    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    const formValues = form.getValues()
    const formState = form.formState

    return (
        <div className="fixed top-4 right-4 bg-green-900 text-white p-4 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-2">{title}</h3>
            
            <div className="space-y-1">
                <div><strong>Form Values:</strong></div>
                <pre className="text-xs bg-black p-1 rounded">
                    {JSON.stringify(formValues, null, 2)}
                </pre>
                
                <div className="mt-2"><strong>Form State:</strong></div>
                <div>- isDirty: {formState.isDirty ? 'true' : 'false'}</div>
                <div>- isValid: {formState.isValid ? 'true' : 'false'}</div>
                <div>- isSubmitting: {formState.isSubmitting ? 'true' : 'false'}</div>
                <div>- isLoading: {formState.isLoading ? 'true' : 'false'}</div>
                
                {Object.keys(formState.errors).length > 0 && (
                    <>
                        <div className="mt-2"><strong>Errors:</strong></div>
                        <pre className="text-xs bg-red-800 p-1 rounded">
                            {JSON.stringify(formState.errors, null, 2)}
                        </pre>
                    </>
                )}
            </div>
        </div>
    )
}

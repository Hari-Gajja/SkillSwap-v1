import { useState, useEffect } from 'react';
import config from '../config/env.js';
import { validateEnvironment } from '../utils/envValidator.js';

const EnvironmentTest = () => {
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    setValidation(validateEnvironment());
  }, []);

  if (!config.isDevelopment) {
    return null; // Don't show in production
  }

  if (!validation) {
    return <div>Loading environment validation...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-base-200 p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔧 Environment Status</h3>
      
      <div className="text-xs space-y-1">
        <div>
          <span className="font-medium">API:</span> {validation.config.apiUrl}
        </div>
        <div>
          <span className="font-medium">Socket:</span> {validation.config.socketUrl}
        </div>
        <div>
          <span className="font-medium">Mode:</span> {validation.config.environment}
        </div>
      </div>

      {validation.isValid ? (
        <div className="text-success text-xs mt-2 flex items-center gap-1">
          <span>✅</span> Configuration Valid
        </div>
      ) : (
        <div className="text-error text-xs mt-2">
          <div className="flex items-center gap-1 mb-1">
            <span>❌</span> Configuration Issues
          </div>
          {validation.issues.map((issue, index) => (
            <div key={index} className="text-xs">• {issue}</div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="text-warning text-xs mt-2">
          <div className="flex items-center gap-1 mb-1">
            <span>⚠️</span> Warnings
          </div>
          {validation.warnings.map((warning, index) => (
            <div key={index} className="text-xs">• {warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnvironmentTest;

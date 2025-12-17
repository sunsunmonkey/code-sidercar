import React from "react";
import { Input } from "../common/Input";

export interface AdvancedSectionProps {
  advanced: {
    maxLoopCount: number;
    contextWindowSize: number;
  };
  onChange: (field: string, value: string | number) => void;
  errors?: {
    maxLoopCount?: string;
    contextWindowSize?: string;
  };
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  advanced,
  onChange,
  errors = {},
}) => {
  const handleMaxLoopCountChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onChange("maxLoopCount", numValue);
    }
  };

  const handleContextWindowSizeChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onChange("contextWindowSize", numValue);
    }
  };

  return (
    <section className="p-5 rounded-xl bg-(--vscode-editor-background) shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all">
      <h2 className="text-base font-semibold text-(--vscode-foreground) m-0 mb-3">
        Advanced Settings
      </h2>

      <Input
        label="Max Loop Count"
        type="number"
        value={advanced.maxLoopCount}
        onChange={handleMaxLoopCountChange}
        error={errors.maxLoopCount}
        min={1}
        placeholder="10"
      />
      <Input
        label="Context Window Size"
        type="number"
        value={advanced.contextWindowSize}
        onChange={handleContextWindowSizeChange}
        error={errors.contextWindowSize}
        min={1}
        placeholder="8192"
      />
    </section>
  );
};

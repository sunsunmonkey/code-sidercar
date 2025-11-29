import React from 'react';
import { Toggle } from '../common/Toggle';

export interface PermissionsSectionProps {
  permissions: {
    allowReadByDefault: boolean;
    allowWriteByDefault: boolean;
    allowExecuteByDefault: boolean;
  };
  onChange: (field: string, value: boolean) => void;
}

export const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  permissions,
  onChange,
}) => {
  return (
    <section className="p-4 mb-4 border border-[var(--vscode-panel-border)] rounded bg-[var(--vscode-editor-background)] transition-all">
      <h2 className="text-base font-semibold text-[var(--vscode-foreground)] m-0 mb-4 pb-2 border-b border-[var(--vscode-panel-border)]">
        Permission Settings
      </h2>
      <Toggle
        label="Allow Read by Default"
        checked={permissions.allowReadByDefault}
        onChange={(checked) => onChange('allowReadByDefault', checked)}
      />
      <Toggle
        label="Allow Write by Default"
        checked={permissions.allowWriteByDefault}
        onChange={(checked) => onChange('allowWriteByDefault', checked)}
      />
      <Toggle
        label="Allow Execute by Default"
        checked={permissions.allowExecuteByDefault}
        onChange={(checked) => onChange('allowExecuteByDefault', checked)}
      />
    </section>
  );
};

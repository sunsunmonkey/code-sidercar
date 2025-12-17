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
    <section className="p-5 rounded-xl bg-[var(--vscode-editor-background)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all">
      <h2 className="text-base font-semibold text-[var(--vscode-foreground)] m-0 mb-3">
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

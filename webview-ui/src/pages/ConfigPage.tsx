/**
 * ConfigPage - Configuration page using shadcn-ui components
 * Uses react-hook-form with zod for form validation
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { configSchema, type ConfigFormValues } from "../schemas/config";
import { useVSCodeApi, useMessageListener } from "../hooks/useVSCodeApi";
import type {
  ConfigMessage,
  ConfigResponse,
} from "code-sidecar-shared/types/messages";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { UnsavedChangesDialog } from "../components/ui/unsaved-changes-dialog";

interface ConfigPageProps {
  isActive: boolean;
  onBack: () => void;
}

export const ConfigPage = ({ isActive, onBack }: ConfigPageProps) => {
  const { postMessage } = useVSCodeApi();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingBack, setPendingBack] = useState(false);
  const lastSavedConfigRef = useRef<ConfigFormValues | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    responseTime?: number;
  } | null>(null);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    mode: "onChange",
    defaultValues: {
      api: {
        baseUrl: "",
        model: "",
        apiKey: "",
        temperature: 0.7,
        maxTokens: 4096,
      },
      permissions: {
        allowReadByDefault: true,
        allowWriteByDefault: false,
        allowExecuteByDefault: false,
      },
      advanced: { maxLoopCount: 10, contextWindowSize: 8192 },
    },
  });
  const { isDirty } = useFormState({ control: form.control });

  /**
   * Handle messages from extension
   */
  const handleMessage = useCallback(
    (message: ConfigResponse) => {
      switch (message.type) {
        case "configuration_loaded":
          form.reset(message.config);
          lastSavedConfigRef.current = message.config;
          setIsLoading(false);
          break;
        case "configuration_saved":
          setIsSaving(false);
          {
            const currentValues = form.getValues();
            form.reset(currentValues);
            lastSavedConfigRef.current = currentValues;
          }
          if (pendingBack) {
            setPendingBack(false);
            onBack();
          }
          break;
        case "connection_test_result":
          setIsTesting(false);
          setTestResult({
            success: message.success,
            error: message.error,
            responseTime: message.responseTime,
          });
          break;
      }
    },
    [form, onBack, pendingBack]
  );

  useMessageListener<ConfigResponse>(handleMessage, [handleMessage]);

  useEffect(() => {
    const message: ConfigMessage = { type: "get_configuration" };
    postMessage(message);
  }, [postMessage]);

  /**
   * Save configuration
   */
  const onSubmit = (data: ConfigFormValues) => {
    setIsSaving(true);
    const message: ConfigMessage = { type: "save_configuration", config: data };
    postMessage(message);
  };

  /**
   * Test API connection
   */
  const handleTestConnection = async () => {
    const isValid = await form.trigger([
      "api.baseUrl",
      "api.model",
      "api.apiKey",
      "api.temperature",
      "api.maxTokens",
    ]);
    if (!isValid) return;

    setIsTesting(true);
    setTestResult(null);
    const message: ConfigMessage = {
      type: "test_connection",
      apiConfig: form.getValues("api"),
    };
    postMessage(message);
  };

  const handleBackClick = () => {
    if (isSaving) {
      setPendingBack(true);
      return;
    }

    if (!isDirty) {
      onBack();
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleDiscardChanges = () => {
    setPendingBack(false);
    setIsConfirmOpen(false);
    if (lastSavedConfigRef.current) {
      form.reset(lastSavedConfigRef.current);
    }
    onBack();
  };

  const handleSaveAndBack = () => {
    setPendingBack(true);
    setIsConfirmOpen(false);
    void form.handleSubmit(onSubmit, () => setPendingBack(false))();
  };

  const hasErrors = !form.formState.isValid;
  const panelContent = isLoading ? (
    <div className="flex items-center justify-center h-full text-sm text-[var(--vscode-foreground)] opacity-70">
      Loading configuration...
    </div>
  ) : (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-6 md:pb-8 gap-5"
      >
        {/* API Settings */}
        <section className="rounded-2xl bg-[var(--vscode-editor-background)] px-5 py-5 shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
          <h2 className="text-base font-semibold mb-3">API Settings</h2>

          <FormField
            control={form.control}
            name="api.baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://api.openai.com/v1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api.model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Name</FormLabel>
                <FormControl>
                  <Input placeholder="gpt-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api.apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="sk-..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api.temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    max={2}
                    placeholder="0.7"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api.maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="4096"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Permission Settings */}
        <section className="rounded-2xl bg-[var(--vscode-editor-background)] px-5 py-5 shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
          <h2 className="text-base font-semibold mb-1">Permission Settings</h2>
          <p className="text-[12px] text-[var(--vscode-descriptionForeground)] mb-4">
            Choose what the assistant can do by default before asking for
            approval.
          </p>

          <div className="space-y-1">
            <FormField
              control={form.control}
              name="permissions.allowReadByDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-3 border-b border-[var(--vscode-panel-border)]">
                  <FormLabel className="flex-1 font-normal">
                    Allow Read by Default
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions.allowWriteByDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-3 border-b border-[var(--vscode-panel-border)]">
                  <FormLabel className="flex-1 font-normal">
                    Allow Write by Default
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions.allowExecuteByDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-3">
                  <FormLabel className="flex-1 font-normal">
                    Allow Execute by Default
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Advanced Settings */}
        <section className="rounded-2xl bg-[var(--vscode-editor-background)] px-5 py-5 shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
          <h2 className="text-base font-semibold mb-1">Advanced Settings</h2>
          <FormDescription className="mb-5">
            Control safety limits and how much context the assistant keeps in
            memory.
          </FormDescription>

          <FormField
            control={form.control}
            name="advanced.maxLoopCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Loop Count</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advanced.contextWindowSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context Window Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="8192"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 py-2">
          <Button
            type="submit"
            disabled={hasErrors || isSaving || isTesting}
            loading={isSaving}
          >
            Save Configuration
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={hasErrors || isSaving || isTesting}
            loading={isTesting}
          >
            Test Connection
          </Button>
        </div>

        {testResult && (
          <div
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] mx-auto max-w-md ${
              testResult.success
                ? "text-[var(--vscode-testing-iconPassed,#73bf69)] bg-[rgba(115,191,105,0.1)]"
                : "text-[var(--vscode-errorForeground)] bg-[var(--vscode-inputValidation-errorBackground)]"
            }`}
          >
            {testResult.success ? (
              <>
                <Check size={16} strokeWidth={2.4} className="shrink-0" />
                <span>
                  Connection successful
                  {testResult.responseTime &&
                    ` (${testResult.responseTime}ms)`}
                </span>
              </>
            ) : (
              <>
                <X size={16} strokeWidth={2.4} className="shrink-0" />
                <span>{testResult.error || "Connection failed"}</span>
              </>
            )}
          </div>
        )}
      </form>
    </Form>
  );

  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      <UnsavedChangesDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndBack}
        isSaving={isSaving}
        isTesting={isTesting}
        hasErrors={hasErrors}
      />
      <div className="flex flex-col h-screen w-full">
        <div className="flex items-center gap-3 p-5 bg-[var(--vscode-sideBar-background)] shrink-0">
          <button
            type="button"
            className="m-0 inline-flex items-center rounded-md bg-transparent px-2 py-1 text-base font-semibold text-[var(--vscode-button-foreground)] transition-colors cursor-pointer border-none hover:bg-[var(--vscode-button-hoverBackground)]"
            onClick={handleBackClick}
          >
            {"< Back"}
          </button>
          <h2 className="m-0 text-base font-semibold">Configuration</h2>
        </div>
        <div className="relative flex flex-col h-full w-full overflow-y-auto bg-[var(--vscode-sideBar-background)] text-[var(--vscode-foreground)]">
          {panelContent}
        </div>
      </div>
    </div>
  );
};


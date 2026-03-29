import SettingsClient from '@/app/(auth)/settings/SettingsClient';
import { mockSettings, mockChildren } from '../mock-data';

export default function DevPreviewSettings() {
  return (
    <SettingsClient
      initialSettings={mockSettings}
      initialChildren={mockChildren}
    />
  );
}

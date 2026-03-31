import SettingsClient from '@/app/(auth)/settings/SettingsClient';
import { mockSettings, mockChildren } from '../mock-data';

export default function DemoSettings() {
  return (
    <SettingsClient
      initialSettings={mockSettings}
      initialChildren={mockChildren}
    />
  );
}

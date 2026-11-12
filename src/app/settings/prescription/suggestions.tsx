
import { Guard } from '../../../layout/Page';
import { SuggestionSettings } from '../../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <SuggestionSettings />
    </Guard>
  );
}

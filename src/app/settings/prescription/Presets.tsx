import { Guard } from '../../../layout/Page';
import { PresetsScreen } from '../../../screens/SettingsScreens';

export default function Route() {
    return (
        <Guard roles={['doctor']}>
            <PresetsScreen />
        </Guard>
    );
}
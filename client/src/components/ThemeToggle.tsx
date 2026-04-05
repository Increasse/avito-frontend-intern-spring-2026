import { useMantineColorScheme, Switch } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
        <Switch
            size="md"
            onLabel={<IconSun size={16} />}
            offLabel={<IconMoon size={16} />}
            checked={colorScheme === 'dark'}
            onChange={() => toggleColorScheme()}
            className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2"
        />
    );
}
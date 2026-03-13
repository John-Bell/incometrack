import { Icon } from './Icon';

interface IconPickerProps {
    value?: string;
    onChange: (iconName: string) => void;
}

const ICONS = [
    'category',
    'home',
    'restaurant',
    'water_drop',
    'directions_car',
    'shopping_bag',
    'medical_services',
    'confirmation_number',
    'savings',
    'flight_takeoff',
    'pets',
    'local_cafe',
    'fitness_center',
    'school',
    'child_care',
    'electric_bolt',
    'phone_iphone',
    'tv',
    'styler',
    'train',
    'local_gas_station',
    'shopping_cart',
    'checkroom',
    'health_and_safety',
    'celebration',
    'auto_awesome',
];

export function IconPicker({ value = 'category', onChange }: IconPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Budget Icon (optional)</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-300 dark:border-primary/20 h-48 overflow-y-auto custom-scrollbar">
                {ICONS.map((iconName) => (
                    <button
                        key={iconName}
                        type="button"
                        onClick={() => onChange(iconName)}
                        className={`
                            flex items-center justify-center p-2 rounded-xl transition-all aspect-square
                            ${value === iconName
                                ? 'bg-primary text-background-dark shadow-sm'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                        `}
                        title={iconName}
                    >
                        <Icon name={iconName} className="text-xl" />
                    </button>
                ))}
            </div>
        </div>
    );
}

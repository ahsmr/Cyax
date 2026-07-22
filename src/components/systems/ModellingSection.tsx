import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Layers } from 'lucide-react';
import { ElectricalSystem } from './section1/ElectricalSystem';
import styles from './ModellingSection.module.css';

// Define available system types
export type SystemType =
  | 'electrical'
  | 'energy-based'
  | 'translational'
  | 'rotational'
  | 'fluidic'
  | 'thermal';

interface SystemOption {
  id: SystemType;
  label: string;
}

const SYSTEM_OPTIONS: SystemOption[] = [
  { id: 'electrical', label: 'Electrical systems' },
  { id: 'energy-based', label: 'Energy-based modeling' },
  { id: 'translational', label: 'Translational mechanical systems' },
  { id: 'rotational', label: 'Rotational mechanical systems' },
  { id: 'fluidic', label: 'Fluidic systems' },
  { id: 'thermal', label: 'Thermal systems' },
];

export const ModellingSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('electrical');

  const renderActiveSystemModule = () => {
    switch (selectedSystem) {
      case 'electrical':
        return <ElectricalSystem />;
      case 'energy-based':
      case 'translational':
      case 'rotational':
      case 'fluidic':
      case 'thermal':
      default:
        const currentOption = SYSTEM_OPTIONS.find((opt) => opt.id === selectedSystem);
        return (
          <div className={styles.placeholderContainer}>
            <Layers size={20} className={styles.placeholderIcon} />
            <span>
              <strong>{currentOption?.label}</strong> module is currently under development. Check back soon!
            </span>
          </div>
        );
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerTitle}>
          <Cpu size={18} className={styles.iconBlue} />
          <span>1. Modelling for Systems Theory and Control Design</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className={styles.body}>
          <p className={styles.description}>
            Select a physical domain to model its differential equations, transfer functions, and state-space parameters.
          </p>

          {/* System Selection Button Bar */}
          <div className={styles.systemSelectorGrid}>
            {SYSTEM_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`${styles.systemBtn} ${
                  selectedSystem === option.id ? styles.activeBtn : ''
                }`}
                onClick={() => setSelectedSystem(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Active System Module Output */}
          {renderActiveSystemModule()}
        </div>
      )}
    </div>
  );
};
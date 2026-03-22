import React, { useState, useEffect } from 'react';

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

export default function FormattedNumberInput({ value, onChange, ...props }: FormattedNumberInputProps) {
  const [displayVal, setDisplayVal] = useState('');

  useEffect(() => {
    if (value != null) {
      setDisplayVal(new Intl.NumberFormat('fr-FR').format(Number(value)));
    } else {
      setDisplayVal('');
    }
  }, [value]);

  const internalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawString = e.target.value.replace(/[^0-9]/g, '');
    if (rawString === '') {
      setDisplayVal('');
      onChange(null);
      return;
    }
    const parsed = parseInt(rawString, 10);
    setDisplayVal(new Intl.NumberFormat('fr-FR').format(parsed));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      value={displayVal}
      onChange={internalChange}
      {...props}
    />
  );
}

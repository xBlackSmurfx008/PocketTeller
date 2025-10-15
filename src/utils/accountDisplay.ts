interface NameParts {
  type: string;
  subtype: string | null;
  officialName?: string | null;
  name: string;
  mask?: string | null;
}

function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/[\s_-]+/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function getAccountDisplayName({ type, subtype, officialName, name, mask }: NameParts): string {
  const lowerType = (type || '').toLowerCase();
  const lowerSubtype = (subtype || '').toLowerCase();

  let baseLabel: string | null = null;

  if (lowerType === 'depository') {
    if (lowerSubtype === 'checking') baseLabel = 'Checking';
    else if (lowerSubtype === 'savings') baseLabel = 'Savings';
    else if (lowerSubtype) baseLabel = titleCase(lowerSubtype);
    else baseLabel = 'Depository';
  } else if (lowerType === 'credit') {
    baseLabel = 'Credit Card';
  } else if (lowerType === 'loan') {
    if (lowerSubtype === 'auto') baseLabel = 'Auto Loan';
    else if (lowerSubtype === 'student') baseLabel = 'Student Loan';
    else if (lowerSubtype === 'mortgage') baseLabel = 'Mortgage';
    else if (lowerSubtype) baseLabel = `${titleCase(lowerSubtype)} Loan`;
    else baseLabel = 'Loan';
  } else if (lowerType === 'investment') {
    baseLabel = 'Investment';
  } else if (lowerType) {
    baseLabel = titleCase(lowerType);
  }

  // Prefer explicit baseLabel for consistency; fallback to officialName or name
  let display = baseLabel || officialName || name;

  if (mask) {
    display += ` • ••${mask}`;
  }

  return display;
}



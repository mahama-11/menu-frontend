export function buildLabelMap(items: Array<{ id: string; label: string }>) {
  return items.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});
}

export function labelFor(id: string, labels: Record<string, string>) {
  return labels[id] || id;
}

export function platformSummary(platforms: string[], labels: Record<string, string>) {
  if (platforms.length === 0) return 'Template';
  if (platforms.length === 1) return labelFor(platforms[0], labels);
  return `${labelFor(platforms[0], labels)} +${platforms.length - 1}`;
}

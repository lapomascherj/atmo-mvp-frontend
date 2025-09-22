
export const colorOptions = [
  { name: 'orange', value: 'text-[#ff7000]' },
  { name: 'blue', value: 'text-blue-400' },
  { name: 'green', value: 'text-green-400' },
  { name: 'purple', value: 'text-purple-400' },
  { name: 'yellow', value: 'text-yellow-400' },
  { name: 'rose', value: 'text-rose-400' },
];

export const getColorClass = (color: string = 'orange'): string => {
  const option = colorOptions.find(opt => opt.name === color);
  return option ? option.value : 'text-[#ff7000]';
};

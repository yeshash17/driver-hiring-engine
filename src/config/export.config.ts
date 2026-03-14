export const EMP_EXPORT_HEADERS = [
  'Villa', 'Employee ID', 'Branch', 'Time in', 'Time out',
  'Day in', 'Hour in', 'Pickup car', 'Trip in start',
  'Trip in duration (to stop)', 'Trip in duration (total)',
  'Day out', 'Hour out', 'Return car', 'Trip out start',
  'Trip out duration (to stop)', 'Trip out duration (total)',
  'Shift hours', 'Shift cost',
] as const;

export const CAR_EXPORT_HEADERS = [
  'Villa', 'Car Plate', 'Car Type', 'Path Type', 'Path ID',
  'Driver', 'Time Start', 'Day Start', 'Hour Start',
  'Number of Employees', 'Passengers by stop',
  'Distance km', 'Traveling time', 'Fuel+Mnt cost',
] as const;

export const BR_EXPORT_HEADERS = [
  'Villa', 'Branch', 'Time', 'Day', 'Hour',
  'Emp Req', 'Emp Req Adj', 'Emp Allocated (N)',
  'overstaffing', 'understaffing', 'Emp Allocated (ID)',
  'Car Req', 'Car Req Adj', 'Car Allocated (N)', 'Car Allocated (ID)',
] as const;

export const EDIT_EXPORT_HEADERS = [
  'Type', 'Key', 'Old Value', 'New Value',
] as const;

export const META_EXPORT_HEADERS = [
  'Employee ID', 'Name', 'Can Drive', 'Experience', 'Home Branch', 'Area Manager',
] as const;

export const MGR_EXPORT_HEADERS = ['Branch', 'Area Manager'] as const;

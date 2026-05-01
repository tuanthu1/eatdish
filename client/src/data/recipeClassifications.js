export const DEFAULT_CATEGORY_OPTIONS = [
  { value: 'Mon_chinh', label: 'Món chính', imageUrl: '' },
  { value: 'Mon_phu', label: 'Món phụ', imageUrl: '' },
  { value: 'Mon_chay', label: 'Món chay', imageUrl: '' },
  { value: 'Mon_nuoc', label: 'Món nước / Canh', imageUrl: '' },
  { value: 'Trang_mieng', label: 'Tráng miệng', imageUrl: '' },
  { value: 'Do_uong', label: 'Đồ uống', imageUrl: '' },
  { value: 'Khac', label: 'Khác', imageUrl: '' }
];

export const DEFAULT_MEALTYPE_OPTIONS = [
  { value: 'Bua_sang', label: 'Bữa sáng' },
  { value: 'Bua_trua', label: 'Bữa trưa' },
  { value: 'Bua_toi', label: 'Bữa tối' },
  { value: 'An_vat', label: 'Ăn vặt' },
  { value: 'Tiec', label: 'Tiệc / Đãi khách' },
  { value: 'Khong_xac_dinh', label: 'Không xác định' }
];

export const DEFAULT_RECIPE_CLASSIFICATIONS = {
  categories: DEFAULT_CATEGORY_OPTIONS,
  mealTypes: DEFAULT_MEALTYPE_OPTIONS
};

export const withAllOption = (options, allLabel) => {
  const list = Array.isArray(options) && options.length > 0 ? options : [];
  return [{ value: 'all', label: allLabel }, ...list];
};

export const toLabelMap = (options) => {
  return (options || []).reduce((acc, item) => {
    if (item?.value) acc[item.value] = item.label;
    return acc;
  }, {});
};

import { updateAllowedCategoryTypes } from './modal-assign-permissions.component';

describe('ModalAssignPermissionsComponent category type selection', () => {
  it('adds a checked database category type without duplicating existing values', () => {
    expect(updateAllowedCategoryTypes(['RAW_MATERIAL'], 'FINISHED_PRODUCT', true))
      .toEqual(['RAW_MATERIAL', 'FINISHED_PRODUCT']);
    expect(updateAllowedCategoryTypes(['RAW_MATERIAL'], 'RAW_MATERIAL', true))
      .toEqual(['RAW_MATERIAL']);
  });

  it('removes an unchecked database category type from the submitted array', () => {
    expect(updateAllowedCategoryTypes(
      ['RAW_MATERIAL', 'FINISHED_PRODUCT', 'RESALE_ITEM'],
      'FINISHED_PRODUCT',
      false,
    )).toEqual(['RAW_MATERIAL', 'RESALE_ITEM']);
  });

  it('creates a valid array when the stored value is missing', () => {
    expect(updateAllowedCategoryTypes(undefined, 'RAW_MATERIAL', true))
      .toEqual(['RAW_MATERIAL']);
  });
});

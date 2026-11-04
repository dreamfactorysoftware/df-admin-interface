import {
  Budget,
  budgetPayload,
  budgetToForm,
  emptyBudgetForm,
} from './budgets.service';

describe('budgetPayload', () => {
  const form = {
    ...emptyBudgetForm(),
    label: ' Sales ',
    dimension_id: 4,
    budget_usd: 50,
  };

  it('sends no auth header when the field is blank, so PATCH keeps it', () => {
    expect(budgetPayload(form)).not.toHaveProperty('alert_webhook_auth_header');
    expect(budgetPayload(form)).not.toHaveProperty('clear_alert_webhook_auth');
  });

  it('sends a typed auth header', () => {
    const payload = budgetPayload({
      ...form,
      alert_webhook_auth_header: ' Bearer x ',
    });
    expect(payload['alert_webhook_auth_header']).toBe('Bearer x');
  });

  it('clears instead of sending a header when asked to clear', () => {
    const payload = budgetPayload({
      ...form,
      alert_webhook_auth_header: 'Bearer x',
      clear_alert_webhook_auth: true,
    });
    expect(payload['clear_alert_webhook_auth']).toBe(true);
    expect(payload).not.toHaveProperty('alert_webhook_auth_header');
  });

  it('nulls the record id for a global rule', () => {
    const payload = budgetPayload({ ...form, dimension_type: 'global' });
    expect(payload['dimension_id']).toBeNull();
  });

  it('trims the label and sends a blank webhook as null', () => {
    const payload = budgetPayload(form);
    expect(payload['label']).toBe('Sales');
    expect(payload['alert_webhook_url']).toBeNull();
  });
});

describe('budget forms', () => {
  it('starts with hard stop off', () => {
    expect(emptyBudgetForm().hard_stop).toBe(false);
  });

  it('starts an edit with a blank auth header', () => {
    const budget = {
      id: 1,
      label: 'x',
      dimension_type: 'global',
      dimension_id: null,
      period: 'daily',
      budget_usd: 1,
      hard_stop: true,
      alert_webhook_url: null,
      has_alert_webhook_auth: true,
    } as Budget;
    const edit = budgetToForm(budget);
    expect(edit.alert_webhook_auth_header).toBe('');
    expect(edit.has_alert_webhook_auth).toBe(true);
    expect(edit.alert_webhook_url).toBe('');
  });
});

const baseUrl = process.env.API_BASE_URL;
const accessToken = process.env.AUTH0_ACCESS_TOKEN;
const prefix = process.env.SIMULATION_PREFIX ?? 'SIM-20260904-';

if (!baseUrl || !accessToken) {
  throw new Error(
    'API_BASE_URL and AUTH0_ACCESS_TOKEN are required for Cloudflare lifecycle simulation',
  );
}

if (!prefix.startsWith('SIM-')) {
  throw new Error('SIMULATION_PREFIX must start with SIM-');
}

async function api(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json',
      ...options.headers,
    },
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      (options.method ?? 'GET') + ' ' + path + ' failed: '
        + response.status + ' ' + responseText,
    );
  }
  return responseText ? JSON.parse(responseText) : undefined;
}

function assertCollectionContains(records, id, route) {
  if (!Array.isArray(records) || !records.some((record) => record.id === id)) {
    throw new Error('GET ' + route + ' did not return created resource ' + id);
  }
}

const cleanupPaths = [];
const cleanupErrors = [];
let executionError;

try {
  const property = await api('/properties', {
    method: 'POST',
    body: JSON.stringify({
      name: prefix + '한강 리버뷰',
      location: 'Seoul, KR',
      type: 'Apartment',
      occupancy: 0,
      status: 'Active',
    }),
  });
  cleanupPaths.push('/properties/' + property.id);

  const tenant = await api('/tenants', {
    method: 'POST',
    body: JSON.stringify({
      name: prefix + '김하늘',
      propertyId: property.id,
      unit: 'A-901',
      rent: '₩1,200,000',
      status: 'Pending',
    }),
  });
  cleanupPaths.push('/tenants/' + tenant.id);

  const contract = await api('/contracts', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      tenantId: tenant.id,
      unit: 'A-901',
      monthlyRent: '₩1,200,000',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      status: 'Active',
    }),
  });
  cleanupPaths.push('/contracts/' + contract.id);

  const payment = await api('/payments', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      contractId: contract.id,
      amount: '₩1,200,000',
      dueDate: '2026-09-05',
      status: 'Pending',
    }),
  });
  cleanupPaths.push('/payments/' + payment.id);
  const paidPayment = await api('/payments/' + payment.id, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Paid', paidAt: '2026-09-05' }),
  });
  if (paidPayment.status !== 'Paid') {
    throw new Error('Payment did not transition to Paid');
  }

  const maintenance = await api('/maintenance', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      task: prefix + '보일러 점검',
      dueDate: '2026-09-05',
      status: 'Pending',
    }),
  });
  cleanupPaths.push('/maintenance/' + maintenance.id);
  await api('/maintenance/' + maintenance.id, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Scheduled' }),
  });
  const completedMaintenance = await api('/maintenance/' + maintenance.id, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Completed' }),
  });
  if (completedMaintenance.status !== 'Completed') {
    throw new Error('Maintenance did not transition to Completed');
  }

  const inspection = await api('/inspections', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: property.id,
      type: prefix + '정기 안전 점검',
      scheduledDate: '2026-09-02',
      status: 'Pending',
      priority: 'Routine',
    }),
  });
  cleanupPaths.push('/inspections/' + inspection.id);
  await api('/inspections/' + inspection.id, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Scheduled' }),
  });
  const completedInspection = await api('/inspections/' + inspection.id, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Completed', completedAt: '2026-09-03' }),
  });
  if (completedInspection.status !== 'Completed') {
    throw new Error('Inspection did not transition to Completed');
  }

  const [properties, tenants, contracts, payments, maintenanceRecords, inspections] = await Promise.all([
    api('/properties'),
    api('/tenants'),
    api('/contracts'),
    api('/payments'),
    api('/maintenance'),
    api('/inspections'),
  ]);
  assertCollectionContains(properties, property.id, '/properties');
  assertCollectionContains(tenants, tenant.id, '/tenants');
  assertCollectionContains(contracts, contract.id, '/contracts');
  assertCollectionContains(payments, payment.id, '/payments');
  assertCollectionContains(maintenanceRecords, maintenance.id, '/maintenance');
  assertCollectionContains(inspections, inspection.id, '/inspections');
  console.log('Lifecycle created:', {
    propertyId: property.id,
    tenantId: tenant.id,
    contractId: contract.id,
    paymentId: payment.id,
    maintenanceId: maintenance.id,
    inspectionId: inspection.id,
  });
} catch (error) {
  executionError = error;
} finally {
  for (const path of cleanupPaths.reverse()) {
    try {
      await api(path, { method: 'DELETE' });
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
  }
}

if (cleanupErrors.length > 0) {
  throw new Error('Lifecycle cleanup failed: ' + cleanupErrors.join(' | '));
}
if (executionError) {
  throw executionError;
}

console.log('Lifecycle cleanup completed.');

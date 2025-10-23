const { getExternalArchive } = require('../shared/external-sources');

exports.handler = async function handler() {
  try {
    const payload = await getExternalArchive(true);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        refreshedAt: payload.fetchedAt,
        visualizingPalestine: payload.visualizingPalestine.length,
        bdsCampaigns: payload.bdsCampaigns.length,
      }),
    };
  } catch (error) {
    console.error('[refresh-external-archive] failed', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Unable to refresh external archive.' }),
    };
  }
};

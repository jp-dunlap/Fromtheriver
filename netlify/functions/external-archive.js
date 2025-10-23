const { getExternalArchive } = require('../shared/external-sources');

exports.handler = async function handler() {
  try {
    const payload = await getExternalArchive(false);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
      body: JSON.stringify(payload),
    };
  } catch (error) {
    console.error('[external-archive] failed', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Unable to refresh external archive.' }),
    };
  }
};

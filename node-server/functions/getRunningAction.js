import axios from "axios";

export default async function () {
  try {
    const response = await axios.get('http://localhost:8080/api/actions');
    return {
      send: [{
        payload: response.data
      }]
    };
  } catch (error) {
    return {
      send: [{
        error: {
          message: 'Failed to fetch actions',
          details: error.message
        }
      }]
    };
  }
}

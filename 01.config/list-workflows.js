import axios from 'axios';

const n8nUrl = 'https://dtar-n8n.oj16f5.easypanel.host';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjdiNzVkMy05ZTE5LTQzODItYjJiOC1jYzk4NDYyMzgwZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImFjMDM1MmZhLTcyMGQtNDYwMS05OTQ2LTI2NzAwNWQ4NDYyZSIsImlhdCI6MTc3NTIyNzgzNn0.cfkuF906g3erQp_LbvBtWj0DPUO9yXIXCIgFH5L0QJU';

async function listWorkflows() {
  try {
    const response = await axios.get(`${n8nUrl}/rest/workflows`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    console.log(`Workflows encontrados: ${response.data.data.length}`);
    response.data.data.forEach((workflow) => {
      console.log(`- ${workflow.name} (ID: ${workflow.id})`);
    });
  } catch (error) {
    if (error.response) {
      console.error('Error HTTP', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

listWorkflows();
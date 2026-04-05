import axios from 'axios';

const n8nUrl = 'https://dtar-n8n.oj16f5.easypanel.host';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjdiNzVkMy05ZTE5LTQzODItYjJiOC1jYzk4NDYyMzgwZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImFjMDM1MmZhLTcyMGQtNDYwMS05OTQ2LTI2NzAwNWQ4NDYyZSIsImlhdCI6MTc3NTIyNzgzNn0.cfkuF906g3erQp_LbvBtWj0DPUO9yXIXCIgFH5L0QJU';

async function createWorkflow(userName = 'Usuario') {
  const workflow = {
    name: `workflow-${userName}`,
    active: true,
    nodes: [
      {
        parameters: {
          httpMethod: 'GET',
          path: 'hello',
          responseMode: 'lastNode',
          responseData: '={{$json}}',
          options: {
            noWebhookResponse: false
          }
        },
        name: 'Start HTTP',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          functionCode: `return [{ json: { message: 'Hola ${userName}, este workflow fue creado automáticamente por el script.' } }];`
        },
        name: 'Set Message',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [450, 300]
      }
    ],
    connections: {
      'Start HTTP': {
        main: [
          [
            {
              node: 'Set Message',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  };

  try {
    const response = await axios.post(`${n8nUrl}/rest/workflows`, workflow, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Workflow creado con éxito:', response.data.name, 'ID:', response.data.id);
    console.log('Puedes abrirlo en la UI de n8n para editarlo.');
  } catch (error) {
    if (error.response) {
      console.error('Error HTTP', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

createWorkflow('Arti');

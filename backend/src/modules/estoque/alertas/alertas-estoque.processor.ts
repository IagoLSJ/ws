import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('alertas-estoque')
export class AlertasEstoqueProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<void> {
    const { negocioId, produtoNome, quantidadeAtual, estoqueMinimo } = job.data;

    console.log(
      `[ALERTA] Ruptura de estoque - Negócio: ${negocioId}, ` +
      `Produto: ${produtoNome}, Atual: ${quantidadeAtual}, Mínimo: ${estoqueMinimo}`,
    );

    // TODO: implementar envio de email/webhook
  }
}

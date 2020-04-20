import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, EMPTY } from 'rxjs';
import { map, catchError, flatMap, shareReplay, retry } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiRestService {

  public rootPath = "/"; // atualmente esta hospedado em http://queronegociarnet.com.br/
  
  public mostrarAbas = [true, true];

  public acordos: any;
        
  public devedor: Devedor; 
  public dividas: any;
  public parcelas = new Parcelas();
  public codTitulo: string;
  public cpfCnpj: string;
  public plano: string;
  public telefone: string;
  public email: string;
  public telaFinal = false;

  public dividasTvVirtua: Divida;
  public dividasNetfone: Divida;

  public opcoesPg = { }; 

  //private urlDadosDevedor = 'https://my-json-server.typicode.com/GuilhermeHobbs/devedornet/devedornet';
  public urlDadosDevedor = 'http://186.215.156.250:8085/w-api/net/GetDadosDevedor';
  //private urlDadosDevedor = '../w-api/net/GetDadosDevedor';
  private urlDadosDivida = 'http://186.215.156.250:8085/w-api/net/GetDadosDivida';
  //private urlDadosDivida = 'https://my-json-server.typicode.com/GuilhermeHobbs/dividanet/dividanet';
  //private urlDadosDivida = '../w-api/net/GetDadosDivida';
  //private urlOpcoesPagamento = 'https://my-json-server.typicode.com/GuilhermeHobbs/opcoesnet/opcoesnet'; 
  private urlOpcoesPagamento = 'http://186.215.156.250:8085/w-api/net/GetOpcoesPagamento';
  //private urlOpcoesPagamento = '../w-api/net/GetOpcoesPagamento';
  //private urlDadosAcordo = 'https://my-json-server.typicode.com/GuilhermeHobbs/dadosacordonet/dadosacordonet';  // 'http://172.22.4.33:8085/landingpage/apiresposta/apirequest_getdadosacordo.php';
  private urlDadosAcordo = 'http://186.215.156.250:8085/w-api/net/GetDadosAcordo';
  //private urlDadosAcordo = '../w-api/net/GetDadosAcordo';
  //private urlGravaAcordo = 'https://my-json-server.typicode.com/GuilhermeHobbs/gravanet/gravanet';
  private urlGravaAcordo = 'http://186.215.156.250:8085/w-api/net/GravarAcordo';
  //private urlGravaAcordo = '../w-api/net/GravarAcordo';
  //private urlBoletoAcordo = 'https://my-json-server.typicode.com/GuilhermeHobbs/boletoAcordo/boleto'; // 'http://172.22.4.33:8085/landingpage/apiresposta/apirequest_getboletoacordo.php';
  private urlBoletoAcordo = 'http://186.215.156.250:8085/w-api/net/GetBoletoAcordo';
  //private urlBoletoAcordo = '../w-api/net/GetBoletoAcordo';
  //private urlEnviaSms = 'https://my-json-server.typicode.com/GuilhermeHobbs/smsEnvio/sms';
  private urlEnviaSms = 'http://186.215.156.250:8085/w-api/net/enviarSMS';
  //private urlEnviaSms = '../w-api/net/enviarSMS';
  //private urlBoletoEmail = 'w-api/net/enviarBoletoPorEmail';
  private urlBoletoEmail = 'http://186.215.156.250:8085/w-api/net/enviarBoletoPorEmail';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
  };
  
  
  constructor(private http: HttpClient) { }

  temDividasouAcordo(cpfCnpj: string): Observable<number> {
     
     this.cpfCnpj = cpfCnpj;
      return this.getDadosDevedor(cpfCnpj).pipe( flatMap( (devedor: any) => {
      if (devedor.data.Codigo === '27') return of(0);
      if (devedor.data.Codigo === '10') {
        if (!devedor.data.Devedores) return of(0);
        
        console.log(devedor);
        if (devedor.data.Devedores.Devedor.CodigoDevedor) {
          this.devedor = new Devedor();
          this.devedor = {
            data: {
              Devedores: {
                Devedor: [devedor.data.Devedores.Devedor]
              }  
            }
          }
        }
        else {
          this.devedor = devedor;
        }
        return this.getDadosDivida(cpfCnpj, this.devedor.data.Devedores.Devedor[0].CodigoDevedor).pipe( map( (divida: Divida) => {
          console.log(divida);
          console.log("this.devedor.data.Devedores.Devedor=");
          console.log(this.devedor.data.Devedores.Devedor);
          if (divida.data.Codigo !== '23' && divida.data.Codigo !== '10') return 2;
          
          this.dividas = divida;
          if (divida.data.Acordos) {
            this.acordos = divida.data.Acordos.DadosAcordo;
            return 1;
          }
          if (divida.data.Dividas) return 1;
          return 0;
        }));
      }
        else return of(2); 
      }));  
  }

  getNome(): string {
    return this.devedor.data.Devedores.Devedor[0].Nome.toLowerCase();
  }  

  meLigue(num: string): Observable<boolean> {
    return of(true);
  } 

  
 getDadosDevedor(cpfCnpj: string): Observable<Devedor> {
  const cpfCnpjParam = new HttpParams().set('cpf', cpfCnpj)
                                       .set('origin', 'portal')
   return this.http.post<Devedor>(this.urlDadosDevedor, cpfCnpjParam, this.httpOptions).pipe(
     retry(100),
     catchError(() => {
       return EMPTY;
     }),
     shareReplay()
     ) 
   
  }  

 getDadosDivida(cpfCnpj: string, codDevedor: string): Observable<Divida> {
  const cpfDevedorParam = new HttpParams()
  .set('cpf', cpfCnpj)    
  .set('codigodevedor', codDevedor)
  .set('origin', 'portal')
  return this.http.post<Divida>(this.urlDadosDivida,cpfDevedorParam, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    )  
 }  

 getOpcoesPagamento(codTitulo: string): Observable<OpcoesPagamento> {
  const cpfCnpjParam = new HttpParams().set('codigotitulo', codTitulo)
                                       .set('cpf', this.cpfCnpj)
                                       .set('origin', 'portal')
  return this.http.post<OpcoesPagamento>(this.urlOpcoesPagamento, cpfCnpjParam, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    )  
 } 

 getDadosAcordo(codTitulo: string): Observable<any> {
  const cpfCnpjParam = new HttpParams().set('codigotitulo', codTitulo)
                                       .set('cpf', this.cpfCnpj)
                                       .set('origin', 'portal')
  return this.http.post(this.urlDadosAcordo, cpfCnpjParam, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    ) 
 }
 
 getBoletoAcordo(codAcordo: string, codCodigoAcordo: string): Observable<any> {
  const params = new HttpParams().set('codigoacordo', codAcordo)
                                 .set('codigoparcelaacordo', codCodigoAcordo)
                                 .set('cpf', this.cpfCnpj)
                                 .set('origin', 'portal')    
  return this.http.post(this.urlBoletoAcordo, params, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    ) 
 }

 enviaSms(codigobarra: string, vencimento: string, valor: string): Observable<any> {
  let nome = this.devedor.data.Devedores.Devedor[0].Nome.toLocaleUpperCase().split(' ')[0];
  const params = new HttpParams().set('cpf', this.cpfCnpj)
                                 .set('numeroenvio', this.telefone)
                                 .set('textosms', nome + ", Codigo Barras de sua conta NET Vencimento " + vencimento + ", Valor R$ " + valor + ", Codigo " + codigobarra)
                                 .set('origin', 'portal')
  return this.http.post(this.urlEnviaSms, params, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    ) 
 }
 

 gravaAcordo(codTitulo: string, cpf: string, codDevedor: string, codPlano: string, vencimentoPrimeira: string, valorPrimeira: string): Observable<any> {
  const params = new HttpParams().set('codigotitulo', codTitulo)
                                       .set('cpf', cpf)
                                       .set('codigodevedor', codDevedor)
                                       .set('codigotitulo', codTitulo)
                                       .set('plano', codPlano)
                                       .set('vencimentoprimeira', vencimentoPrimeira)
                                       .set('valorprimeira', valorPrimeira.replace('.',','))   // o acordo só é feito com uma virgula separando as casas decimais
                                       .set('origin', 'portal')

  return this.http.post(this.urlGravaAcordo, params, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    ) 
 }
  

 enviaBoletoEmail(contrato: string, valor: string, vencimento: string, linha: string, email: string): Observable<any> {
  const params = new HttpParams().set('cliente', this.devedor.data.Devedores.Devedor[0].Nome.toLocaleUpperCase())
                                 .set('cpf', this.cpfCnpj)
                                 .set('contrato', contrato)
                                 .set('valor', valor)
                                 .set('vencimento', vencimento)
                                 .set('codigobarra', this.linhaDigitavelToCodigoBarras(linha))
                                 .set('linhadigitavel', linha)
                                 .set('email', email)
                                 .set('origin', 'portal')

  return this.http.post(this.urlBoletoEmail, params, this.httpOptions).pipe(
    retry(100),
    catchError(() => {
      return EMPTY;
    }),
    shareReplay()
    )
 }
 
 getDividas() {

  this.dividasTvVirtua = new Divida();
  this.dividasTvVirtua = {
    data: {
      Dividas: {
        Divida: []
      }
    }  
  };                

  this.dividasNetfone = new Divida();
  this.dividasNetfone = {
    data: {
      Dividas: {
        Divida: []
      }
    }  
  };

  if (this.dividas && this.dividas.data.Dividas) {

  if (this.dividas.data.Dividas.Divida.length) {

    this.dividasTvVirtua.data.Dividas.Divida = this.dividas.data.Dividas.Divida.filter( div => div.Produto === "TV/VIRTUA" );  
    this.dividasNetfone.data.Dividas.Divida = this.dividas.data.Dividas.Divida.filter( div => div.Produto === "NETFONE" );
  
  }
  
  else { 
    
    switch (this.dividas.data.Dividas.Divida.Produto) {
      case "TV/VIRTUA": {
        this.dividasTvVirtua.data.Dividas.Divida.push(this.dividas.data.Dividas.Divida);
        break;
      } 
      case "NETFONE": {
        this.dividasNetfone.data.Dividas.Divida.push(this.dividas.data.Dividas.Divida);
        break;
      }
      
  }  

 } 
}
}

 getAllOpcoesTvVirtua() {

if (this.opcoesPg[this.dividasTvVirtua.data.Dividas.Divida[0].CodigoTitulo]) return true; 

 this.dividasTvVirtua.data.Dividas.Divida.forEach ( (divida) => {
 
  this.opcoesPg[divida.CodigoTitulo] = new BehaviorSubject<OpcoesPagamento>({
    Carregando: true,
    data: {
      OpcoesPagamento: {
        OpcaoPagamento: {
          ValorNegociar: "Aguarde...",
        }
      }
    }  
  });  
   this.getOpcoesPagamento(divida.CodigoTitulo).subscribe( (opc: OpcoesPagamento) => {
    opc.Carregando = false;
    if (opc.data.Codigo === '24') opc.OutraCobradora = true;
    this.opcoesPg[divida.CodigoTitulo].next(opc);
    });
  }); 
 }


 getAllOpcoesNetfone() {

  if (this.opcoesPg[this.dividasNetfone.data.Dividas.Divida[0].CodigoTitulo]) return true;  
  this.dividasNetfone.data.Dividas.Divida.forEach ( (divida) => {
  
   this.opcoesPg[divida.CodigoTitulo] = new BehaviorSubject<OpcoesPagamento>({
     Carregando: true,
     data: {
       OpcoesPagamento: {
         OpcaoPagamento: {
           ValorNegociar: "Aguarde...",
         }
       }
     }  
   });  
    this.getOpcoesPagamento(divida.CodigoTitulo).subscribe( (opc: OpcoesPagamento) => {
     opc.Carregando = false;
     if (opc.data.Codigo === '24') opc.OutraCobradora = true;
     this.opcoesPg[divida.CodigoTitulo].next(opc);
     });
   });
   }

   doisDigitosDecimais (num: string) {
    num = num.replace(',','.');
    if (num.indexOf('.') === num.length-2) return num + '0';
    if (num.indexOf('.') === -1)  return num + '.00'; 
     return num;
  }

  linhaDigitavelToCodigoBarras(linha: string) {

    linha = linha.trim();
    let num = linha.split(' ').join('');
    return num.substring(0, 11) + num.substring(12, 23) + num.substring(24, 35) + num.substring(36, 47);

  }


}

  export class Divida {
    data: {
      Codigo?: string;
      Dividas?: {
        Divida?: Array<{
            CodigoDevedor?: string;
            CodigoTitulo?: string;
            NumeroTitulo?: string;
            Produto?: string;
            Parcelas: {
              Produto?: string;
              ParcelaDivida: Array<{
                CodigoParcela: string;
                DescricaoItemExtrato?: string;
                NumeroFatura: string;
                Valor: string;
                Vencimento: string;
              }>
            }
        }>  
      }
      Acordos?: any  
    }
 
  }

  export class Devedor {
    data: {
      Codigo?: string;
      Devedores: {
        Devedor: Array<{
          Credor: string;
          Contrato: string;
          CodigoDevedor: string;
          Nome: string;
        }>    
      }
    }  
  }

  export class OpcoesPagamento {
    Carregando?: boolean;
    OutraCobradora?: boolean;
    data: {
      Codigo?: string;
      OpcoesPagamento?: {
        OpcaoPagamento: {
          Plano?: number;
          ValorCorrecao?: string;
          ValorCorrigido?: string;
          ValorDemaisParcelas?: string;
          ValorDesconto?: string;
          ValorNegociar?: string;
          ValorOriginal?: string;
          ValorPrimeira?: string;
          VencimentoDemaisParcelas?: string;
          VencimentoPrimeira?: string;                        

        }
      }
    }    
  }

  export class Acordo {
        CodigoAcordo: string;
        CodigoDevedor: string;
        CodigoTitulo: string;
        DataAcordo: string;
        Filial: string;
        NumeroTitulo: string;
        StatusAcordo: string;
        ParcelasAcordo: {
          ParcelaAcordo: Array<{
            CodigoParcelaAcordo: string;
            DataVencimento: string;
            NumeroParcela: string;
            StatusParcelaAcordo: string;
            ValorParcela: string;
          }>
        }
      }

  export class Parcelas {
    primeira?: string;
    outrasParcelas?: string;
    vezes?: number;
    aVista?: string;
  }

  export class Boleto {
    data: {
      BoletoAcordo: {
        DataVencimento: string;
        LinhaDigitavel: string;
        Valor: string;
      }
    }  
  }
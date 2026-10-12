import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { NppUnit } from '@/lib/npp';
export function useNpp() {
 const qc=useQueryClient();
 const query=useQuery({queryKey:['npp-dataset'],queryFn:async()=>{
  const {data,error}=await supabase.from('npp_election_datasets').select('*').order('created_at',{ascending:false}).order('id',{ascending:true}).limit(1).maybeSingle();
  if(error)throw error;
  return data ? {...data, records:data.records as unknown as NppUnit[],owner_aliases:data.owner_aliases as Record<string,string>} : null;
 }});
 const save=useMutation({mutationFn:async(input:{records:NppUnit[];source_name:string})=>{
  const {data:auth}=await supabase.auth.getUser();
  const {error}=await supabase.from('npp_election_datasets').insert({records:input.records as unknown as Json,source_name:input.source_name,created_by:auth.user?.id});if(error)throw error;
 },onSuccess:()=>qc.invalidateQueries({queryKey:['npp-dataset']})});
 const merge=useMutation({mutationFn:async(aliases:Record<string,string>)=>{
  if(!query.data)throw new Error('Data belum tersedia');
  const {error}=await supabase.from('npp_election_datasets').update({owner_aliases:aliases}).eq('id',query.data.id);if(error)throw error;
 },onSuccess:()=>qc.invalidateQueries({queryKey:['npp-dataset']})});
 return {...query,save,merge};
}

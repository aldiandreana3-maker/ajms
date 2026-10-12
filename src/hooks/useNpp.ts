import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { NppUnit } from '@/lib/npp';
export function useNpp() {
 const { isAdmin, role } = useAuth(); const canManage = isAdmin || role === 'staff_tro';
 const qc=useQueryClient();
 const query=useQuery({queryKey:['npp-dataset'],enabled:canManage,queryFn:async()=>{
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
 const manage=useMutation({mutationFn:async(input:{action:'add'|'edit'|'delete';original?:NppUnit;record?:NppUnit})=>{
  if(!canManage)throw new Error('Akses NPP ditolak');
  if(!query.data)throw new Error('Data belum tersedia');
  const {error}=await supabase.rpc('manage_npp_unit',{_dataset_id:query.data.id,_action:input.action,_original:input.original as unknown as Json ?? null,_record:input.record as unknown as Json ?? null});
  if(error)throw error;
 },onSuccess:()=>qc.invalidateQueries({queryKey:['npp-dataset']})});
 return {...query,save,merge,manage,canManage};
}

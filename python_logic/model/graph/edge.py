
class Edge:
    def __init__(self, src_vtx_id, src_port_id, tgt_vtx_id, tgt_port_id, consistency=True):
        assert isinstance(src_vtx_id, str), "Assert source vertex id is string"
        assert isinstance(src_port_id, str), "Assert source port id is string"
        assert isinstance(tgt_vtx_id, str), "Assert target vertex id is string"
        assert isinstance(tgt_port_id, str), "Assert target port id is string"
        
        self._src_vtx_id = src_vtx_id
        self._src_port_id = src_port_id
        self._tgt_vtx_id = tgt_vtx_id
        self._tgt_port_id = tgt_port_id
        self.set_consistency(consistency)
    
    def source_port_id(self):
        return self._src_port_id
    
    def source_vertex_id(self):
        return self._src_vtx_id
    
    def target_port_id(self):
        return self._tgt_port_id
    
    def target_vertex_id(self):
        return self._tgt_vtx_id
    
    def set_consistency(self, consistency):
        assert type(consistency) == bool, "Assert consistency value is a boolean"
        self._consistency = consistency
    
    def to_json_serializable(self):
        consistency_str = "consistent" if self._consistency else "inconsistent"
        return {
            "consistency": consistency_str,
            "sourceVertexId": self._src_vtx_id,
            "sourcePortId": self._src_port_id,
            "targetVertexId": self._tgt_vtx_id,
            "targetPortId": self._tgt_port_id
        }
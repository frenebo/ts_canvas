from .edge import Edge
import random

class Graph():
    def __init__(self):
        self._edges = {}
        self._edges_by_source = {}
        self._edges_by_target = {}
        self._vertices = {}
    
    def create_edge(
        self,
        edge_id,
        source_vertex_id,
        source_port_id,
        target_vertex_id,
        target_port_id):
        
        self._edges[edge_id] = Edge(
            source_vertex_id,
            source_port_id,
            target_vertex_id,
            target_port_id,
        )
        
        self._edges_by_source[source_vertex_id].add(edge_id)
        self._edges_by_target[target_vertex_id].add(edge_id)
    
    def validate_edge(
        self,
        edge_id,
        source_vertex_id,
        source_port_id,
        target_vertex_id,
        target_port_id):
        if edge_id in self._edges:
            return "An edge with the id " + edge_id + " already exists"
        if source_vertex_id not in self._vertices:
            return "Source vertex with id " + source_vertex_id + " does not exist"
        if not self._vertices[source_vertex_id].has_port(source_port_id):
            return "Target port with id " + source_port_id + " does not exist on the target vertex"
        if target_vertex_id not in self._vertices:
            return "Target vertex with id " + target_vertex_id + " does not exist"
        if not self._vertices[target_vertex_id].has_port(target_port_id):
            return "Target port with id " + target_port_id + " does not exist on the target vertex"
        
        source_vtx = self._vertices[source_vertex_id]
        target_vtx = self._vertices[target_vertex_id]
        source_port = source_vtx.get_port(source_port_id)
        target_port = target_vtx.get_port(target_port_id)
        
        if source_port.port_type() != "output":
            return "Source port is not an output port"
        
        if target_port.port_type() != "input":
            return "Target port is not an input port"
        
        # check for loops
        source_ancestors = set()
        source_ancestors_uninvestigated = set()
        source_ancestors_uninvestigated.add(source_vertex_id)
        while len(source_ancestors_uninvestigated) != 0:
            ancestor_id = source_ancestors_uninvestigated.pop()
            source_ancestors.add(ancestor_id)

            for edge_id in self._edges_by_target[ancestor_id]:
                edge_source_id = self._edges[edge_id].source_vertex_id()
                if edge_source_id not in source_ancestors and edge_source_id not in source_ancestors_uninvestigated:
                    source_ancestors_uninvestigated.add(edge_source_id)
        
        if target_vertex_id in source_ancestors:
            return "Loops detected"
        
        return None
    
    def delete_vertex(self, vtx_id):
        del self._vertices[vtx_id]
        # | is the union operator for sets
        for edge_id in self._edges_by_source[vtx_id] | self._edges_by_target[vtx_id]:
            self.delete_edge(edge_id)

        del self._edges_by_source[vtx_id]
        del self._edges_by_target[vtx_id]
    
    def delete_edge(self, edge_id):
        edge = self._edges[edge_id]

        self._edges_by_source[edge.source_vertex_id()].remove(edge_id)
        self._edges_by_target[edge.target_vertex_id()].remove(edge_id)
        
        del self._edges[edge_id]

    def add_vertex(self, vtx_id, vertex):
        self._vertices[vtx_id] = vertex
        self._edges_by_source[vtx_id] = set()
        self._edges_by_target[vtx_id] = set()
    
    def has_edge_id(self, edge_id):
        return edge_id in self._edges
    
    def has_vertex_id(self, vtx_id):
        return vtx_id in self._vertices
    
    def get_vertex(self, vtx_id):
        return self._vertices[vtx_id]
    
    def edge_ids_between_vertices(self, vertex_ids):
        edges_out_of_vertices = set()
        edges_into_vertices = set()
        for vtx_id in vertex_ids:
            for edge_id_out in self._edges_by_source[vtx_id]:
                if edge_id_out not in edges_out_of_vertices:
                    edges_out_of_vertices.add(edge_id_out)
            
            for edge_id_in in self._edges_by_target[vtx_id]:
                if edge_id_in not in edges_into_vertices:
                    edges_into_vertices.add(edge_id_in)
        
        # edges that both begin and end on these vertices are the one to return the ids of
        # & operator finds intersection
        return list(edges_into_vertices & edges_out_of_vertices)
    
    @staticmethod
    def _get_unique_ids_dict(count, dictionary):
        ids = []
        
        for _ in range(count):
            random_float = random.uniform(0, 1)
            factor = 1000

            while True:
                generated_id = str(int(random_float*factor))

                if generated_id not in ids and generated_id not in dictionary:
                    ids.append(generated_id)
                    break
                else:
                    factor *= 10
        
        return ids

    
    def get_unique_edge_ids(self, count):
        return Graph._get_unique_ids_dict(count, self._edges)
    
    def get_unique_vertex_ids(self, count):
        return Graph._get_unique_ids_dict(count, self._vertices)
    
    def to_json_serializable(self):
        vertices = {}
        edges = {}
        for vtx_id in self._vertices:
            vertices[vtx_id] = self._vertices[vtx_id].to_json_serializable()
        
        for edge_id in self._edges:
            edges[edge_id] = self._edges[edge_id].to_json_serializable()
        
        return {
            "vertices": vertices,
            "edges": edges,
        }

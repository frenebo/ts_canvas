from .graph import Graph, Vertex, Port
from .layers import BaseLayer, RepeatIntLayer, LayerUpdateException


class Model:
    def __init__(self):
        self._graph = Graph()
        self._layer_dict = {}
        
        self._graph.add_vertex("id1", Vertex({
            "inputPort": Port("top", 0.5, "input", "inputInt"),
            "outputPort": Port("bottom", 0.5, "output", "outputInt")
        }, 0, 0))
        self._layer_dict["id1"] = RepeatIntLayer()
    
    # def make_request(self, req):
    #     req_type = req["type"]

    #     if req_type == "request_model_changes":
    #         change_reqs = req["reqs"]
            
    #         for change_req in change_reqs:
    #             self._make_model_change_request(change_req)
            
    #         return {}
    #     elif req_type == "request_versioning_change":
    #         return {}
    #     elif req_type == "request_model_info":
    #         info_req = req["req"]
    #         return self.make_info_request(info_req)

    def json_serializable_graph(self):
        return self._graph.to_json_serializable()
    
    def request_model_changes(self, reqs):
        for req in reqs:
            self.request_model_change(req)
    
    def request_model_change(self, req):
        req_type = req["type"]

        if req_type == "moveVertex":
            vtx_id = req["vertexId"]
            new_x = req["x"]
            new_y = req["y"]

            if not self._graph.has_vertex_id(vtx_id):
                return
            
            vtx = self._graph.get_vertex(vtx_id)
            
            vtx.set_x(new_x)
            vtx.set_y(new_y)
        elif req_type == "cloneVertex":
            src_vtx_id = req["sourceVertexId"]
            new_vtx_id = req["newVertexId"]
            new_vtx_x = req["x"]
            new_vtx_y = req["y"]

            if self._graph.has_vertex_id(new_vtx_id):
                return
            if not self._graph.has_vertex_id(src_vtx_id):
                return
            # @TODO : prevent cloning of some layers, like Input or Output layers

            new_vtx = self._graph.get_vertex(src_vtx_id).clone()
            new_vtx.set_x(new_vtx_x)
            new_vtx.set_y(new_vtx_y)
            self._graph.add_vertex(new_vtx_id, new_vtx)
            new_layer = self._layer_dict[src_vtx_id].clone()
            self._layer_dict[new_vtx_id] = new_layer
        elif req_type == "createEdge":
            # print(req)
            new_edge_id = req["newEdgeId"]
            src_vtx_id = req["sourceVertexId"]
            src_port_id = req["sourcePortId"]
            tgt_vtx_id = req["targetVertexId"]
            tgt_port_id = req["targetPortId"]

            validated = self._graph.validate_edge(
                new_edge_id,
                src_vtx_id,
                src_port_id,
                tgt_vtx_id,
                tgt_port_id,
            )

            if validated is not None:
                return
            
            self._graph.create_edge(
                new_edge_id,
                src_vtx_id,
                src_port_id,
                tgt_vtx_id,
                tgt_port_id,
            )
        elif req_type == "deleteVertex":
            vtx_id = req["vertexId"]
            if not self._graph.has_vertex_id(vtx_id):
                return
            
            self._graph.delete_vertex(vtx_id)
            del self._layer_dict[vtx_id]
        elif req_type == "deleteEdge":
            edge_id = req["edgeId"]
            if not self._graph.has_edge_id(edge_id):
                return
            
            self._graph.delete_edge(edge_id)
        elif req_type == "setLayerFields":
            raise Exception("unimplemented")
        # type: "setLayerFields";
        # layerId: string;
        # fieldValues: {
        # [key: string]: string;
        # };
        # };
    
    def make_info_request(self, req):
        req_type = req["type"]

        if req_type == "validateEdge":
            possible_err = self._graph.validate_edge(
                req["edgeId"],
                req["sourceVertexId"],
                req["sourcePortId"],
                req["targetVertexId"],
                req["targetPortId"],
            )
            if possible_err is None:
                return {"valid": True}
            else:
                return {"valid": False, "problem": possible_err}
        elif req_type == "edgesBetweenVertices":
            vertex_ids = req["vertexIds"]
            missing_vertices = []
            
            for vtx_id in vertex_ids:
                if not self._graph.has_vertex_id(vtx_id):
                    missing_vertices.append(vtx_id)
            if len(missing_vertices) != 0:
                return {
                    "verticesExist": False,
                    "requestNonexistentVertices": missing_vertices
                }
            
            edge_ids = self._graph.edge_ids_between_vertices(vertex_ids)
            edges = {}
            
            for edge_id in edge_ids:
                edges[edge_id] = self._graph.get_edge(edge_id).to_json_serializable()
            
            return {
                "verticesExist": True,
                "edges": edges
            }
        elif req_type == "fileIsOpen":
            print("Unimplemented fileIsOpen")
            return {
                "fileIsOpen": False
            }
        elif req_type == "savedFileNames":
            print("Unimplemented savedFileNames")
            return {
                "fileNames": []
            }
        elif req_type == "getPortInfo":
            port_id = req["portId"]
            vtx_id = req["vertexId"]
            
            if not self._graph.has_vertex_id(vtx_id):
                return {"couldFindPort": False}
            
            if not self._graph.get_vertex(vtx_id).has_port(port_id):
                return {"couldFindPort": False}
            
            port_value_name = self._graph.get_vertex(vtx_id).get_port(port_id).value_name()
            
            layer_value_str = self._layer_dict[vtx_id].get_field_value_string(port_value_name)

            return {
                "couldFindPort": True,
                "portValue": layer_value_str
            }
        elif req_type == "getLayerInfo":
            layer_id = req["layerId"]

            if layer_id not in self._layer_dict:
                return {
                    "layerExists": False
                }
            
            vertex = self._graph.get_vertex(layer_id)
            layer = self._layer_dict[layer_id]
            
            port_data = {}
            for port_id in vertex.port_ids():
                port_data[port_id] = {
                    "valueName": vertex.get_port(port_id).value_name()
                }
            
            field_data = {}
            for field_name in layer.field_names():
                field_data[field_name] = {
                    "value": layer.get_field_value_string(field_name),
                    "fieldIsReadonly": layer.is_field_read_only(field_name)
                }
            
            return {
                "layerExists": True,
                "data": {
                    "ports": port_data,
                    "fields": field_data
                }
            }
        elif req_type == "validateValue":
            layer_id = req["layerId"]
            field_name = req["valueId"]
            new_value_string = req["newValue"]

            if layer_id not in self._layer_dict:
                return {
                    "requestError": "layer_nonexistent"
                }
            
            if not self._layer_dict[layer_id].has_field(field_name):
                return {
                    "requestError": "field_nonexistent",
                    "fieldName": field_name
                }
            
            validated = self._layer_dict[layer_id].validate_field_value_string(field_name, new_value_string)

            return {
                "requestError": None,
                "fieldValidationError": validated
            }
        elif req_type == "compareValue":
            print("Unimplemented compareValue")
            return {
                "requestError": "layer_nonexistent"
            }
            #   "compareValue": {
            #     "request": {
            #       type: "compareValue";
            #       layerId: string;
            #       valueId: string;
            #       compareValue: string;
            #     };
            #     "response": {
            #       requestError: null;
            #       isEqual: boolean;
            #     } | {
            #       requestError: "layer_nonexistent";
            #     } | {
            #       requestError: "field_nonexistent";
            #     };
            #   };
        elif req_type == "validateLayerFields":
            layer_name = req["layerId"]
            field_value_strings = req["fieldValues"]

            if layer_name not in self._layer_dict:
                return {
                    "requestError": "layer_nonexistent"
                }
            
            cloned_layer = self._layer_dict[layer_name].clone()
            
            errors = []
            
            for field_name in field_value_strings:
                if not cloned_layer.has_field(field_name):
                    return {
                        "requestError": "field_nonexistent",
                        "fieldName": field_name
                    }
                else:
                    validated = cloned_layer.validate_field_value_string(field_name, field_value_strings[field_name])
                    if validated is not None:
                        errors.append(field_name + ": " + validated)
                    else:
                        cloned_layer.set_field_value_string(field_name, field_value_strings[field_name])
            
            if len(errors) != 0:
                return {
                    "requestError": None,
                    "errors": errors,
                    "warnings": []
                }
            
            try:
                cloned_layer.update()
            except LayerUpdateException as exp:
                return {
                    "requestError": None,
                    "errors": [str(exp)],
                    "warnings": [],
                }
            
            return {
                "requestError": None,
                "errors": [],
                "warnings": [],
            }
        elif req_type == "getUniqueEdgeIds":
            count = req["count"]
            return {
                "edgeIds": self._graph.get_unique_edge_ids(count)
            }
        elif req_type == "getUniqueVertexIds":
            count = req["count"]
            return {
                "vertexIds": self._graph.get_unique_vertex_ids(count)
            }
        elif req_type == "valueIsReadonly":
            print("Unimplemented valueIsReadonly")
            return {
                "requestError": None,
                "isReadonly": False,
            }
            #   "valueIsReadonly": {
            #     "request": {
            #       type: "valueIsReadonly";
            #       layerId: string;
            #       valueId: string;
            #     };
            #     "response": {
            #       requestError: null;
            #       isReadonly: false;
            #     } | {
            #       requestError: null;
            #       isReadonly: true;
            #       reason: "port_is_occupied" | "value_is_not_modifiable";
            #     } | {
            #       requestError: "layer_nonexistent";
            #     } | {
            #       requestError: "field_nonexistent";
            #     };
            #   };
        elif req_type == "getGraphData":
            return {
                "data": self._graph.to_json_serializable()
            }
            #   "getGraphData": {
            #     "request": {
            #       type: "getGraphData";
            #     };
            #     "response": {
            #       data: IGraphData;
            #     };
            #   };
            # }

from .graph import Graph, Vertex, Port
from .layers import BaseLayer, RepeatIntLayer, DenseLayer, LayerUpdateException, Conv2DLayer
from .value_wrappers import ValueWrapperException


class Model:
    def __init__(self):
        self._graph = Graph()
        self._layer_dict = {}

        self.add_layer("Dense", 0, 0)
        self.add_layer("Repeat Int", 200, 0)
        self.add_layer("Conv2D", 0, 100)

    def add_layer(self, layer_type, x_pos, y_pos):
        new_layer = None
        
        if layer_type == "Dense":
            new_layer = DenseLayer()
        elif layer_type == "Repeat Int":
            new_layer = RepeatIntLayer()
        elif layer_type == "Conv2D":
            new_layer = Conv2DLayer()
        else:
            raise NotImplementedError()
        
        new_layer_id = self._graph.new_unique_vertex_ids(1)[0]

        self._layer_dict[new_layer_id] = new_layer

        ports = {}
        input_port_idx = 0
        output_port_idx = 0
        
        for port_name in new_layer.port_names():
            port_side = None
            port_type = None
            port_position = None
            
            if new_layer.port_is_input(port_name):
                port_side = "top"
                port_type = "input"
                port_position = (input_port_idx + 1)/(new_layer.input_port_count() + 1)
                
                input_port_idx += 1
            else:
                port_side = "bottom"
                port_type = "output"
                port_position = (output_port_idx + 1)/(new_layer.output_port_count() + 1)
                
                output_port_idx += 1
            
            port_field_name = new_layer.field_name_of_port(port_name)
            
            ports[port_name] = Port(
                port_side,
                port_position,
                port_type,
                port_field_name
            )
        
        self._graph.add_vertex(
            new_layer_id,
            Vertex(layer_type, ports, x_pos, y_pos)
        )

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
            self._propagate_model()
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
            layer_id = req["layerId"]
            field_values = req["fieldValues"]
            update_validated = self._validate_layer_set_fields(layer_id, field_values)
            if update_validated is not None:
                return
            
            self._layer_set_fields(layer_id, field_values)
            self._propagate_model()
        
    def _propagate_model(self):
        topo_sorted_vertices = self._topo_sort_vertices()

        for vertex_id in topo_sorted_vertices:
            for edge_out_id in self._graph.edge_ids_out_of_vertex(vertex_id):
                self._propagate_edge(edge_out_id)
    
    def _propagate_edge(self, edge_id):
        edge =  self._graph.get_edge(edge_id)
        source_vertex = self._graph.get_vertex(edge.source_vertex_id())
        target_vertex = self._graph.get_vertex(edge.target_vertex_id())
        
        source_field_name = source_vertex.get_port(edge.source_port_id()).value_name()
        target_field_name = target_vertex.get_port(edge.target_port_id()).value_name()

        source_layer = self._layer_dict[edge.source_vertex_id()]
        target_layer = self._layer_dict[edge.target_vertex_id()]

        source_field_value_wrapper = source_layer.get_field_val_wrapper(source_field_name)

        target_field_val_wrapper = target_layer.get_field_val_wrapper(target_field_name)

        if target_field_val_wrapper.compare_to_value(source_field_value_wrapper.get_value()):
            edge.set_consistency(True)
            return
        else:
            # validate value
            source_field_value = source_field_value_wrapper.get_value()
            validated_value = target_layer.get_field_val_wrapper(target_field_name).validate_value(source_field_value)
            if validated_value is None:
                cloned_layer = target_layer.clone()
                cloned_layer.get_field_val_wrapper(target_field_name).set_value(source_field_value)

                update_works = None
                try:
                    cloned_layer.update()
                    update_works = True
                except LayerUpdateException:
                    update_works = False
                
                if update_works:
                    target_layer.get_field_val_wrapper(target_field_name).set_value(source_field_value)
                    target_layer.update()
                    edge.set_consistency(True)
                else:
                    edge.set_consistency(False)
            else:
                edge.set_consistency(False)

    def _topo_sort_vertices(self):
        top_to_bottom = []
        remaining_vertex_ids = set(self._graph.vertex_ids())

        while len(remaining_vertex_ids) != 0:
            root_vertex_ids = []
            for vertex_id in remaining_vertex_ids:
                is_root = True
                
                for edge_id_in in self._graph.edge_ids_into_vertex(vertex_id):
                    edge_source_id = self._graph.get_edge(edge_id_in).source_vertex_id()

                    if edge_source_id in remaining_vertex_ids:
                        is_root = False
                
                if is_root:
                    root_vertex_ids.append(vertex_id)
            
            for root_vertex_id in root_vertex_ids:
                top_to_bottom.append(root_vertex_id)
                remaining_vertex_ids.remove(root_vertex_id)
        
        return top_to_bottom

    def _layer_set_fields(self, layer_name, field_value_strings):
        layer = self._layer_dict[layer_name]
        for field_name in field_value_strings:
            layer.get_field_val_wrapper(field_name).set_value_string(field_value_strings[field_name])
        layer.update()
    
    def _validate_layer_set_fields(self, layer_name, field_value_strings):
        if layer_name not in self._layer_dict:
            return "Layer does not exist"
        
        cloned_layer = self._layer_dict[layer_name].clone()
            
        for field_name in field_value_strings:
            try:
                cloned_layer.get_field_val_wrapper(field_name).set_value_string(field_value_strings[field_name])
            except ValueWrapperException as exp:
                return "Field named \"" + field_name + "\" has invalid value: " + str(exp)
            
        try:
            cloned_layer.update()
        except LayerUpdateException as exp:
            return str(exp)
        
        return None

    def _validate_edge_propagation(
        self,
        source_vertex_id,
        source_port_id,
        target_vertex_id,
        target_port_id):
        if not self._graph.has_vertex_id(source_vertex_id):
            return "Source vertex does not exist"
        if not self._graph.has_vertex_id(target_vertex_id):
            return "Target vertex does not exist"
        source_vertex = self._graph.get_vertex(source_vertex_id)
        target_vertex = self._graph.get_vertex(target_vertex_id)
        if source_port_id not in source_vertex.port_ids():
            return "Target port does not exist"
        if target_port_id not in target_vertex.port_ids():
            return "Target port does not exist"
        
        source_field_name = source_vertex.get_port(source_port_id).value_name()
        target_field_name = target_vertex.get_port(target_port_id).value_name()
        
        source_layer = self._layer_dict[source_vertex_id]
        target_layer = self._layer_dict[target_vertex_id]
        
        # validate field
        source_field_value = source_layer.get_field_val_wrapper(source_field_name).get_value()
        value_validated = target_layer.get_field_val_wrapper(target_field_name).validate_value(source_field_value)

        if value_validated is not None:
            return "Source value not compatible with target port: " + value_validated
        
        source_field_value_string = source_layer.get_field_val_wrapper(source_field_name).get_value_string()
        # validate target layer update
        update_validated = self._validate_layer_set_fields(
            target_vertex_id,
            {target_field_name: source_field_value_string}
        )
        
        return update_validated

    def make_info_request(self, req):
        req_type = req["type"]

        if req_type == "validateEdge":
            possible_graph_err = self._graph.validate_edge(
                req["edgeId"],
                req["sourceVertexId"],
                req["sourcePortId"],
                req["targetVertexId"],
                req["targetPortId"],
            )
            
            if possible_graph_err is not None:
                return {"valid": False, "problem": possible_graph_err}

            port_compatibility_err = self._validate_edge_propagation(
                req["sourceVertexId"],
                req["sourcePortId"],
                req["targetVertexId"],
                req["targetPortId"],
            )

            if port_compatibility_err is not None:
                return {"valid": False, "problem": port_compatibility_err}
            
            return {"valid": True}
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
            
            layer_value_str = self._layer_dict[vtx_id].get_field_val_wrapper(port_value_name).get_value_string()

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
            
            # get list of fields that are set by incoming edges - these fields should be read-only
            occupied_fields = []
            for edge_id_in in  self._graph.edge_ids_into_vertex(layer_id):
                target_port_id = self._graph.get_edge(edge_id_in).target_port_id()
                target_field_id = layer.field_name_of_port(target_port_id)
                occupied_fields.append(target_field_id)
            
            field_data = {}
            for field_name in layer.field_names():
                is_readonly = layer.is_field_read_only(field_name) or field_name in occupied_fields
                
                field_data[field_name] = {
                    "value": layer.get_field_val_wrapper(field_name).get_value_string(),
                    "fieldIsReadonly": is_readonly
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
            
            if field_name not in self._layer_dict[layer_id].field_names():
                return {
                    "requestError": "field_nonexistent",
                    "fieldName": field_name
                }
            
            validated = self._layer_dict[layer_id].get_field_val_wrapper(field_name).validate_value_string(new_value_string)

            return {
                "requestError": None,
                "fieldValidationError": validated
            }
        elif req_type == "compareValue":
            layer_id = req["layerId"]
            field_id = req["valueId"]
            compare_value = req["compare_value"]
            if layer_id not in self._layer_dict:
                return {
                    "requestError": "layer_nonexistent",
                }
            
            layer = self._layer_dict[layer_id]

            if field_id not in layer.field_names():
                return {
                    "requestError": "field_nonexistent"
                }
            
            is_equal = layer.get_field_val_wrapper(field_id).compare_to(compare_value)
            
            return {
                "requestError": None,
                "isEqual": is_equal
            }
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
                if field_name not in cloned_layer.field_names():
                    return {
                        "requestError": "field_nonexistent",
                        "fieldName": field_name
                    }
                else:
                    validated = cloned_layer.get_field_val_wrapper(field_name).validate_value_string(field_value_strings[field_name])
                    if validated is not None:
                        errors.append(field_name + ": " + validated)
                    else:
                        cloned_layer.get_field_val_wrapper(field_name).set_value_string(field_value_strings[field_name])
            
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
                "edgeIds": self._graph.new_unique_edge_ids(count)
            }
        elif req_type == "getUniqueVertexIds":
            count = req["count"]
            return {
                "vertexIds": self._graph.new_unique_vertex_ids(count)
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
        elif req_type == "getListOfLayers":
            # @TODO : Make this generated instead of hard-coded
            layers = [
                {
                    "layerName": "Dense",
                    "reasonNotAvailable": None,
                },
                {
                    "layerName": "Conv2D",
                    "reasonNotAvailable": None,
                },
                {
                    "layerName": "Repeat Int",
                    "reasonNotAvailable": "Test reason",
                },
            ]
            
            return {
                "layers": layers
            }
from mds.dora.utils import *
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

def index(request):	
	return render(request, 'main.html', {})

@csrf_exempt
def query(request):
	#Parse the request
	query, concepts_list, locations_list = parse_request(request)

	#Make the query
	query_result_set = get_query_result_set(query, concepts_list, locations_list)

	#Create a list of json objects
	json_obj_list = create_json_obj_list(query_result_set)

	#transform json objects into one json array of objects
	json_obj_array = generate_json_obj_to_return(json_obj_list)

	return HttpResponse(json_obj_array, content_type="application/json")
 
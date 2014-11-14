from mds.dora.utils import *
from mds.dora.models import SavedQuery
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from mds.dora.forms import SavedQueryForm

def index(request):
	user = authenticate(username='admin', password='Sanamobile1')

	if user is not None:
		if user.is_active:
			login(request, user)
			# Redirect to a success page.
			return render(request, 'main.html', {'username':user.username})
		else:
			# Return a 'disabled account' error message
			return HttpResponse('{"assigned":[], "unassigned":[], "status":"disabled account"}', content_type="application/json")
	else:
		# Return an 'invalid login' error message.
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"invalid login"}', content_type="application/json")


@csrf_exempt
def query(request):

	if (not request.user.is_authenticated()):
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"unauthorized"}', content_type="application/json")		
	#Parse the request
	query, concepts_list, locations_list = parse_request(request)
	if (query == None and concepts_list == None and locations_list == None):
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"error"}', content_type="application/json")		

	#Make the query
	query_result_set = get_query_result_set(query, concepts_list, locations_list)

	#Create a list of json objects
	json_response = create_json_response(query_result_set)

	return HttpResponse(json_response, content_type="application/json")


def save_query(request):
	if request.user.is_authenticated():
		form = SavedQueryForm(request.POST)
		
		if (form.is_valid()):
			saved_query = form.save(commit=False)
			saved_query.user = request.user
			saved_query.save()
			form.save_m2m()
			
			return HttpResponse('{"status": "ok"}', content_type="application/json")
		
		else:
			return HttpResponse('{"status": "error"}', content_type="application/json")
		
	else:
		return HttpResponse('{"status":"unauthorized"}', content_type="application/json")
	
def delete_query(request):
	if request.user.is_authenticated():
		uuid = request.body
		if uuid:
			query = get_saved_query(uuid)
			if query.user == request.user:
				query.delete()
				return HttpResponse('{"status": "ok"}', content_type="application/json")
			else:
				return HttpResponse('{"status": "unauthorized"}', content_type="application/json")
		
		else:
			return HttpResponse('{"status": "no such query"}', content_type="application/json")
		
	else:
		return HttpResponse('{"status":"unauthorized"}', content_type="application/json")

@csrf_exempt
def load_saved_queries(request):
	if (not request.user.is_authenticated()):
		return HttpResponse('{"status":"unauthorized"}', content_type="application/json")

	json_response = get_user_saved_queries(request.user)

	return HttpResponse(json_response, content_type="application/json")
 
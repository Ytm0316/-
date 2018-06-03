var Jump = function(){
	this.config = {
		isMobile:false,
		jumper_length:30,
		jumper_width:14,
		jumper_height:40,
		frustumSize:200,
		hell_ground:-25,
		aspect:window.innerWidth / window.innerHeight
	};
	this.falling = {
		end:false,
		speed:0.5
	}
	this.cube_set = {
		horse:[],
		cube_color_order:1,
		cube:[],
		floor:[]
	};
	this.light_set ={
		light	:	new THREE.PointLight( 0xffffff, 2, 500),
		light2	:	new THREE.PointLight( 0xffffff, 1, 500),
		ambient : 	new THREE.AmbientLight(0xfffd87)
	};
	this.helpers = {
		light_helper	: new THREE.CameraHelper( this.light_set.light.shadow.camera ),
		light2_helper	: new THREE.CameraHelper( this.light_set.light2.shadow.camera ),
		gridHelper 		: new THREE.GridHelper( 1000, 20 ),
		axes_helper 	: new THREE.AxesHelper(20)
	}
	this.jumperStat = {
		ready:	false,
		h_speed:	0,
		y_speed:	0,
		position :new THREE.Vector3(0,0,0),
	};
	this.CubeDir = {
		former:'forward',
		current:''
	};
	this.land_info ={
		result:0,
		distance:0//the distance when you landed on next cube.
	//result : 	0 落在空白區
	//			1 落在原本區域 成功
	//			2 落在原本區域 失敗
	//			3 落在下個區域 成功
	//			4 落在下個區域 失敗W
	};
	this.cameraPos = {
		current:new THREE.Vector3(-200,200,200),
		next:new THREE.Vector3(-200,200,200)
	};
	this.play = false;
	this.stat = 1;//1 for alive,0 for gameover.
	this.scene = new THREE.Scene();
	this.renderer = new THREE.WebGLRenderer();
	this.loader = new THREE.OBJLoader();
	this.camera = new THREE.OrthographicCamera( this.config.frustumSize * this.config.aspect / - 1, this.config.frustumSize * this.config.aspect / 1, this.config.frustumSize / 1, this.config.frustumSize / - 1, 1, 2000 );			
	this.scene.add( this.light_set.light2);			
	this.scene.add( this.light_set.ambient);
	this.scene.add( this.light_set.light );	
};
	Jump.prototype = {
		init:function(){
			this.checkUserAgent();
			this.createHelpers();//create helpers	
			this.LightSetup();//create lights.
			this.RendererSetup();
			this.CameraSetup();
			this.SceneSetup();
			this.createfloor();
			this.createCube();
			this.createCube();
			this.horse_create();//create horse			
			this.updateCamera();

			var mouseEvents = (this.config.isMobile) ? {//check mobile
				down :'touchstart',
				up :'touchend'				
			} :
			{
				down:'mousedown',
				up:'mouseup'
			};
			
			var canvas = document.querySelector('canvas');
			var game = this;
			canvas.addEventListener(mouseEvents.down, 	function(){game.mousedown();});
			canvas.addEventListener(mouseEvents.up, 	function(){game.mouseup();});
			window.addEventListener( 'resize', function(){game.onWindowResize();}, false );	
		},
		checkUserAgent: function() {//done
			var n = navigator.userAgent;
			if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i)) {
				this.config.isMobile = true
			}
		},
		fail_fall:function(){//done falling rotate using.
			var game = this;
			var horse = {
				x:game.cube_set.horse.position.x-game.config.jumper_length/2,
				z:game.cube_set.horse.position.z
			};			
			var cube_next=	this.cube_set.cube[this.cube_set.cube.length-1];
			if(game.land_info.result == 0){
				game.falling_rotate('no');
			}else if(game.land_info.result == 2){
				if(game.CubeDir.current == 'forward'){
					game.falling_rotate('forward2');
				}else if(game.CubeDir.current == 'left'){
					game.falling_rotate('left2');
				}else{
					game.falling_rotate('right2');
				}
			}else if(game.land_info.result==4){
				if(game.CubeDir.current == 'forward'){
					if(horse.x > cube_next.position.x){
						game.falling_rotate('forward2');
					}else{
						game.falling_rotate('forwardrev');
					}
				}else{
					if(horse.z > cube_next.position.z){
						game.falling_rotate('right2');
					}else{
						game.falling_rotate('left2');
					}
				}
			}
		},
		falling_rotate:function(dir){//done with fail fall
			var game = this;
			var size_horse = (game.land_info.result=='forward')? game.config.jumper_length:game.config.jumper_width;
			var cube_width = game.cube_set.cube[game.cube_set.cube.length-1].geometry.parameters.width;
			var offset = size_horse/2  + cube_width/2 - game.land_info.distance;
			var rotateAxis ;
			var rotate ;//rotating speed
			var rotateTo;//to specific angle
			var fallingTo = game.config.hell_ground + game.config.jumper_width/2;//toground.
			if(dir=='forward2'){
				rotateAxis = 'y';
				rotate = game.cube_set.horse.rotation[rotateAxis] + 0.1;
				rotateTo = game.cube_set.horse.rotation[rotateAxis] < Math.PI/2;
				game.cube_set.horse.translateX = offset;//move horse out of the cube area
			}else if(dir=='forwardrev'){
				rotateAxis = 'y';
				rotate = game.cube_set.horse.rotation[rotateAxis] - 0.1;
				rotateTo = game.cube_set.horse.rotation[rotateAxis] > -Math.PI/2;
				game.cube_set.horse.translateX = -offset;//move horse out of the cube area
			}else if(dir=='right2'){
				rotateAxis = 'x';
				rotate = game.cube_set.horse.rotation[rotateAxis] + 0.1;
				rotateTo = game.cube_set.horse.rotation[rotateAxis] < 0;
				game.cube_set.horse.translateZ = offset;//move horse out of the cube area
			}else if(dir=='left2'){
				rotateAxis = 'x';
				rotate = game.cube_set.horse.rotation[rotateAxis] - 0.1;
				rotateTo = game.cube_set.horse.rotation[rotateAxis] > -Math.PI;
				game.cube_set.horse.translateZ = -offset;//move horse out of the cube area
			}else if(dir=='no'){//no sink a lot
				rotateTo = false;
				fallingTo = game.config.hell_ground + game.config.jumper_height/2;
			}else{
				throw Error('Arguments Error');
			}
			if(!game.falling.end){
				if(rotateTo){
					game.cube_set.horse.rotation[rotateAxis] = rotate;
				}else if(game.cube_set.horse.position.y > fallingTo){
					game.cube_set.horse.position.y -= game.falling.speed;
				}else{
					game.falling.end = true;
				}
				game.renderer.render(game.scene,game.camera);
				requestAnimationFrame(function(){
					game.fail_fall();
				});
			}else{
				if(game.failedCallback){
					game.failedCallback();
				}
			}
		},
		mousedown:function(){//game config need to be editted.
			var game = this;
			if(!game.jumperStat.ready&&game.cube_set.horse.scale.z>0.5&&game.play){
				game.cube_set.horse.scale.z -= 0.01;
				game.jumperStat.h_speed += 0.03;
				game.jumperStat.y_speed += 0.04;
				console.log('down');
				game.renderer.render(game.scene,game.camera);
				requestAnimationFrame(function(){
					game.mousedown();
				});
			}
		},
		checkcube:function(){//done
			if(this.cube_set.cube.length>1){
				var pointH = {//horse position. note that the reference point get translated
					x: this.cube_set.horse.position.x-this.config.jumper_length/2,
					z: this.cube_set.horse.position.z
				};
				var pointC = {
					x: this.cube_set.cube[this.cube_set.cube.length - 2].position.x,
					z: this.cube_set.cube[this.cube_set.cube.length - 2].position.z
				};
				var pointN = {
					x: this.cube_set.cube[this.cube_set.cube.length - 1].position.x,
					z: this.cube_set.cube[this.cube_set.cube.length - 1].position.z
				};
				var distanceC,distanceN;
				if(this.CubeDir.current=='forward'){
					distanceC = Math.abs(pointC.x - pointH.x);
					distanceN = Math.abs(pointN.x - pointH.x);
				}else{
					distanceC = Math.abs(pointC.z - pointH.z);
					distanceN = Math.abs(pointN.z - pointH.z);
				}
				var cubewidth_current= this.cube_set.cube[this.cube_set.cube.length-2].geometry.parameters.width;
				var cubewidth_next=	this.cube_set.cube[this.cube_set.cube.length-1].geometry.parameters.width;
				var offset = (this.CubeDir.current=='forward')? (this.config.jumper_length):(this.config.jumper_width);
				var selfArea = cubewidth_current/2 + offset/2 ;
				var nextArea = cubewidth_next/2 + offset/2 ;
				var result = 0;
				if(distanceC < selfArea){
					this.land_info.distance = distanceC;
					result = (distanceC < cubewidth_current/2)? 1:2;
				}else if(distanceN < nextArea){
					this.land_info.distance = distanceN;
					result = (distanceN < cubewidth_next/2)? 3:4;
				}else{
					result = 0;
				}
				this.land_info.result = result;
				
			}
		},
		mouseup:function(){//working... with fail fall
			var game = this;
		if(game.play){
			game.jumperStat.ready = true;
			console.log('up');
			if(game.cube_set.horse.position.y>=0){
				if(game.CubeDir.current=='forward'){
					game.cube_set.horse.position.x += game.jumperStat.h_speed;
				}else if(game.CubeDir.current=='left'){
					game.cube_set.horse.position.z -= game.jumperStat.h_speed;
				}else{
					game.cube_set.horse.position.z += game.jumperStat.h_speed;
				}
				game.cube_set.horse.position.y += game.jumperStat.y_speed;
				game.jumperStat.y_speed -=0.04;
				if(game.cube_set.horse.scale.z<1){
					game.cube_set.horse.scale.z +=0.02;
				}
				game.renderer.render(game.scene,game.camera);
				requestAnimationFrame(function(){
					game.mouseup();
				});
			}else{
				game.jumperStat.ready = false;
				game.jumperStat.h_speed = 0;
				game.jumperStat.y_speed = 0;
				game.cube_set.horse.position.y = 0;
				game.checkcube();
				if(game.land_info.result == 3){
					game.createCube();
					game.updateCamera();
					
					if(game.successCallback){
						game.successCallback();
					}
					
				}else if(game.land_info.resutl == 1){
					//nothing. on current cube.no create cube
				}else{
					game.fail_fall();
				}
			}
		}
		},
		updateCameraPos:function(){//done
			var lastIndex = this.cube_set.cube.length - 1;
			var pointA = {
				x:this.cube_set.cube[lastIndex].position.x,
				z:this.cube_set.cube[lastIndex].position.z
			};
			var pointB = {
				x:this.cube_set.cube[lastIndex-1].position.x,
				z:this.cube_set.cube[lastIndex-1].position.z
			};
			var pointR = new THREE.Vector3();
			pointR.x = (pointA.x+pointB.x)/2;
			pointR.y = 0;
			pointR.z = (pointA.z+pointB.z)/2;
			this.cameraPos.next = pointR;
		},
		updateCamera:function(){//done... floor change too light change too
			var game = this;
			var c = {
				x: game.cameraPos.current.x,
				y: game.cameraPos.current.y,
				z: game.cameraPos.current.z
			};
			var n = {
				x: game.cameraPos.next.x,
				y: game.cameraPos.next.y,
				z: game.cameraPos.next.z
			};
			if(n.x>c.x||n.z>c.z||n.z<c.z){
				game.cameraPos.current.x +=1;
				if(n.z>=c.z){
					game.cameraPos.current.z += 1;
				}else if(n.z<=c.z){
					game.cameraPos.current.z -= 1;
				}
				if(Math.abs(game.cameraPos.current.x - game.cameraPos.next.x)<1.2){
					game.cameraPos.current.x = game.cameraPos.next.x;
				}
				if(Math.abs(game.cameraPos.current.z - game.cameraPos.next.z)<1.2){
					game.cameraPos.current.z = game.cameraPos.next.z;
				}
				game.camera.position.set(c.x-200,200,c.z+200);
				game.camera.lookAt(c.x,0,c.z);
				game.light_set.light.position.set(c.x-100,300,c.z+100);
				game.light_set.light2.position.set(c.x-100,300,c.z+300);
				game.renderer.render(game.scene,game.camera);
				game.floor.position.set(c.x,-15,c.z);
				requestAnimationFrame(function() {
					game.updateCamera();
				});
			}
		},
		createCube:function(){//done
			var rand = Math.random();
			var size = rand*20+30;//size from 30 to 50
			var material = new THREE.MeshStandardMaterial({color: 0x00ff00});
			var geometry = new THREE.BoxGeometry(size,20,size);				
			var mesh = new THREE.Mesh(geometry,material);
			if(this.cube_set.cube.length){
				var dir;
				if(this.CubeDir.current=='forward'){
					var dir_rand = Math.random();
					dir = (dir_rand>0.66) ? 'right':( (dir_rand>0.33) ? 'forward':'left' );

				}else if(this.CubeDir.current=='left'){
					var dir_rand = Math.random();
					dir = (dir_rand>0.5) ? 'left':'forward';	

				}else{
					var dir_rand = Math.random();
					dir = (dir_rand>0.5) ? 'right':'forward';
				}
				this.CubeDir.former = this.CubeDir.current;//update direction
				this.CubeDir.current = dir;
				///////////////////////////
				if(this.CubeDir.current=='forward'){
					mesh.position.x = 	mesh.geometry.parameters.width/2 + 
										this.cube_set.cube[this.cube_set.cube.length-1].geometry.parameters.width/2+
										this.cube_set.cube[this.cube_set.cube.length-1].position.x+
										Math.random()*40+20;
					mesh.position.y =  this.cube_set.cube[this.cube_set.cube.length-1].position.y;
					mesh.position.z =  this.cube_set.cube[this.cube_set.cube.length-1].position.z;				
				}else if(this.CubeDir.current=='left'){
					mesh.position.x =  this.cube_set.cube[this.cube_set.cube.length-1].position.x;
					mesh.position.y =  this.cube_set.cube[this.cube_set.cube.length-1].position.y;
					mesh.position.z =  (-mesh.geometry.parameters.width/2)-
										this.cube_set.cube[this.cube_set.cube.length-1].geometry.parameters.width/2+
										this.cube_set.cube[this.cube_set.cube.length-1].position.z
										-Math.random()*40-20;
				}else{
					mesh.position.x =  this.cube_set.cube[this.cube_set.cube.length-1].position.x;
					mesh.position.y =  this.cube_set.cube[this.cube_set.cube.length-1].position.y;
					mesh.position.z =  (mesh.geometry.parameters.width/2)+
										this.cube_set.cube[this.cube_set.cube.length-1].position.z+
										this.cube_set.cube[this.cube_set.cube.length-1].geometry.parameters.width/2+
										Math.random()*40+20;
				}	
			}else{
				mesh.position.set(-75,-10,75);//default horse position
			}
			
			this.cube_set.cube.push(mesh);
			if(this.cube_set.cube.length>6){
				this.scene.remove(this.cube_set.cube.shift());		
			}
			this.scene.add(mesh);//update camera?
			if(this.cube_set.cube.length > 1) {
				this.updateCameraPos();
			}
		},
		CameraSetup:function(){//done
			this.camera.position.set(-200,200,200);
			this.camera.lookAt(new THREE.Vector3(0,0,0));			
		},
		RendererSetup:function(){/*//done
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.BasicShadowMap;*/
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( this.renderer.domElement );						
		},
		SceneSetup:function(){//done
			this.scene.background = new THREE.Color(0x4286f4);
		},
		LightSetup:function(){//done only adjust position. no add!
			this.light_set.light.position.set( -100, 300, 100 );
			/*this.light_set.light.castShadow = true;*/
			this.light_set.light2.position.set( -100, 250, 300 );
			/*this.light_set.light2.castShadow = true;*/
			//-----------------------------------------------
			/*
			this.light_set.light.shadow.mapSize.width = 512;  // default
			this.light_set.light.shadow.mapSize.height = 512; // default
			this.light_set.light.shadow.camera.near = 0.5;       // default
			this.light_set.light.shadow.camera.far = 500      // default
				
			this.light_set.light2.shadow.mapSize.width = 512;  // default
			this.light_set.light2.shadow.mapSize.height = 512; // default
			this.light_set.light2.shadow.camera.near = 0.5;       // default
			this.light_set.light2.shadow.camera.far = 500      // default
				*/
			//-----------------------------------------------		
		},
		createHelpers:function(){//done
			this.scene.add( this.helpers.light_helper );
			this.scene.add( this.helpers.axes_helper);
			this.scene.add( this.helpers.gridHelper );
			this.scene.add( this.helpers.light2_helper );					
		},
		quickLoad:function(url,num,horse_or_cube,callback){//done
			game = this;
			this.loader.load(
			url,// resource URL
				function(object){
					game.cube_set.cube_color_order=1;
					callback(object);
					if(horse_or_cube==0){
						game.cube_set.horse = object;
						game.jumperStat.position = object.position;
						game.scene.add(game.cube_set.horse);
					}
					else{
						game.cube_set.cube[num] = object;
						game.scene.add(game.cube_set.cube[num]);
					}
				},
				function(xhr){// called when loading is in progresses
					console.log ((xhr.loaded/xhr.total*100)+'% loaded');
				},
				function ( error ) {
					console.log( 'An error happened' );
				}
			);
		},
		onWindowResize:function() {//done
				this.config.aspect = window.innerWidth / window.innerHeight;
				this.camera.left   = - this.config.frustumSize * this.config.aspect / 1;
				this.camera.right  =   this.config.frustumSize * this.config.aspect / 1;
				this.camera.top    =   this.config.frustumSize / 1;
				this.camera.bottom = - this.config.frustumSize / 1;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize( window.innerWidth, window.innerHeight );
				this.renderer.render(this.scene,this.camera);
		},
		horse_create:function(){//done
				var game = this;
				this.quickLoad('obj/horse.obj',0,0,
				function(obj){
					obj.position.set(-75,0,75);
					obj.rotation.x = -Math.PI/2;
					obj.traverse(
						function(child){
							if(child instanceof THREE.Mesh){//child.material = new THREE.MeshBasicMaterial( {color: 0xa5e587} );

								//child.castShadow = true; //default is false
								//child.receiveShadow = false; //default
								if(game.cube_set.cube_color_order==1){
									child.material = new THREE.MeshStandardMaterial( {color: 0xff0000} );
									game.cube_set.cube_color_order++;
								}
								
								else if(game.cube_set.cube_color_order==5){
									child.material = new THREE.MeshStandardMaterial( {color: 0xffff00} );
									game.cube_set.cube_color_order++;
									
								}
								
								else if(game.cube_set.cube_color_order==4){
									child.material = new THREE.MeshStandardMaterial( {color: 0xffbf00} );
									game.cube_set.cube_color_order++;
								}
								
								else if(game.cube_set.cube_color_order==11||game.cube_set.cube_color_order==12){
									child.material = new THREE.MeshStandardMaterial( {color: 0xffffff} );
									game.cube_set.cube_color_order++;
								}
			
								else{
									child.material = new THREE.MeshStandardMaterial( {color: 0x232323} );
									game.cube_set.cube_color_order++;
								}

							}
						});
				});				
		},
		start:function(){//done
			this.play = true;
		},
		stop:function(){//done
			this.play = false;
		},
		addSuccessFn: function(fn) {//done
			this.successCallback = fn
		},
		addFailedFn: function(fn) {//done
			this.failedCallback = fn
		},
		createfloor:function(){//done note that floor position change with updateCamera
			var geo; 
			if(this.config.isMobile){
				geo = new THREE.BoxGeometry(700,10,700);
			}else{
				geo = new THREE.BoxGeometry(1200,10,1200);
			}
			var mat = new THREE.MeshBasicMaterial({color:0x7b8391});
			this.floor = new THREE.Mesh(geo,mat);
			this.floor.position.set(0,-25,0);
			this.scene.add(this.floor);
		},
		restart:function(){//done 
			this.cameraPos  = {
				current:new THREE.Vector3(-200,200,200),
				next:new THREE.Vector3(-200,200,200)
			};
			this.falling = {
				end:false,
				speed:0.5
			};
			var length = this.cube_set.cube.length;
			for(var i = 0;i<length;i++){
				this.scene.remove(this.cube_set.cube.pop());
			}
			this.scene.remove(this.floor);
			this.scene.remove(this.cube_set.horse);
			this.createfloor();
			this.CameraSetup();
			this.LightSetup();
			this.createCube();
			this.createCube();
			this.horse_create();
		},
		gamePropertyAdd:function(to_do){
			to_do();
		}
	};
